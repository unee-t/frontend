// @flow
import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import { check, Match } from 'meteor/check'
import type { Request, Response } from '../rest-types'
import { caseEditableFields, fieldEditMethodMaker, publicationObj as casePubObj } from '../../cases'
import userApiKey, { makeComposedExtractor, bodyExtractor, headerExtractor } from '../middleware/user-api-key-middleware'
import { assigneeAllowedRoles, attemptUserGeneration, getCaseById, isDateString, verifyRole } from './common'
import { logger } from '../../../util/logger'
import UnitMetaData from '../../unit-meta-data'
import UnitRolesData from '../../unit-roles-data'
import { emailValidator } from '../../../util/validators'

const caseEditor = fieldEditMethodMaker({
  methodName: 'PUT /api/case/:id',
  editableFields: caseEditableFields,
  publicationObj: casePubObj
})

const userDefObject = Match.OneOf(
  Match.ObjectIncluding({
    email: Match.Where(emailValidator),
    role: Match.OneOf(...assigneeAllowedRoles)
  }),
  Match.ObjectIncluding({
    userId: String,
    role: Match.Maybe(Match.OneOf(...assigneeAllowedRoles))
  })
)

export default userApiKey((req: Request, res: Response) => {
  const errorLog = 'API request for "PUT /cases" failed: '

  const { user, params, body } = req

  try { // Checking the validity of the payload
    check(req.body, Match.ObjectIncluding({
      title: Match.Maybe(String),
      category: Match.Maybe(String),
      subCategory: Match.Maybe(String),
      severity: Match.Maybe(String),
      priority: Match.Maybe(String),
      solution: Match.Maybe(String),
      solutionDeadline: Match.Maybe(Match.Where(isDateString)),
      nextSteps: Match.Maybe(String),
      nextStepsBy: Match.Maybe(Match.Where(isDateString)),
      assignee: Match.Maybe(userDefObject),
      involvedList: Match.Maybe([userDefObject])
    }))
  } catch (e) {
    logger.warn(errorLog + e.message)
    res.send(400, e.message)
    return
  }

  // Adding all the directly editable fields to an object to be sent to the API
  const editObj = caseEditableFields.reduce((all, field) => {
    if (body[field]) {
      all[field] = body[field]
    }
    return all
  }, {})

  // Checking if any user assignment is required
  if (req.body.involvedList || req.body.assignee) {
    const caseItem = getCaseById(params.id)
    const unitMeta = UnitMetaData.findOne({ bzName: caseItem.selectedUnit })

    // Creating a list of all the user IDs that already have a role in the unit with the associated role type
    const roleMemberDefs = UnitRolesData.find({ unitId: unitMeta._id }).fetch().reduce((all, roleObj) => {
      all = all.concat(roleObj.members.map(mem => ({
        id: mem.id,
        role: roleObj.roleType
      })))

      return all
    }, [])

    let usersToInvite = [] // Keeps track if any users need to be invited in the following section
    const checkIfInviteRequired = userDesc => {
      let userDoc
      if (userDesc.userId) {
        userDoc = Meteor.users.findOne({ _id: userDesc.userId })
        if (!userDoc) {
          throw new Meteor.Error(`No user found for userId ${userDesc.userId}`)
        }
      } else {
        userDoc = Accounts.findUserByEmail(userDesc.email)
        if (!userDoc) {
          usersToInvite.push(userDesc)
          return
        }
      }

      const existingRoleDef = roleMemberDefs.find(def => def.id === userDoc._id)

      // Checking all the various scenarios of whether the role has been specified and whether there is an existing role for the user
      // If the user has a role, and no role has been specified or it is the same as the existing, nothing needs to be done
      if (userDesc.role && !existingRoleDef) {
        usersToInvite.push(userDesc)
      } else if (!userDesc.role && !existingRoleDef) {
        throw new Meteor.Error(`User ${userDoc._id} has no role in the unit associated with the case, so you need to specify it`)
      } else if (userDesc.role && existingRoleDef && userDesc.role !== existingRoleDef.role) {
        throw new Meteor.Error(`User ${userDoc._id} already has a role of ${existingRoleDef.role} in the unit associated with the case, so you can't assign it as ${userDesc.role}`)
      }
    }

    // Checking whether the assignee needs to be invited into the unit
    if (req.body.assignee) {
      try {
        checkIfInviteRequired(req.body.assignee)
      } catch (e) {
        logger.warn(errorLog + e.message)
        res.send(400, e.message)
        return
      }
    }

    // Checking whether the users requested as "involved" users (CC) need to be invited into the unit
    if (req.body.involvedList) {
      try {
        req.body.involvedList.forEach(checkIfInviteRequired)
      } catch (e) {
        logger.warn(errorLog + e.message)
        res.send(400, e.message)
        return
      }
    }

    // Checking if the user is allowed to invite users into the unit, in case any required invitees were found
    if (!unitMeta.ownerIds.includes(user._id) && usersToInvite.length) {
      const message = 'You are not the owner of the unit associated with case, so you are not allowed to add new users to it'
      res.send(400, errorLog + message)
      return
    }

    try {
      usersToInvite.forEach(userDesc => {
        let userDoc
        if (userDesc.email) {
          userDoc = attemptUserGeneration(userDesc.email, user)
        } else {
          userDoc = Meteor.users.findOne({ _id: userDesc.userId })
        }

        verifyRole(user, userDoc, unitMeta, userDoc.role, {
          user: user._id,
          apiEndpoint: `PUT /api/cases`,
          step: 'add users to roles in unit',
          args: req.body
        })
      })
    } catch (e) {
      if (e.reason === 'server error') {
        res.send(500, e.message)
      } else {
        logger.warn(errorLog + e.message)
        res.send(400, e.message)
      }
    }

    const getUserByDesc = desc => desc.userId
      ? Meteor.users.findOne({ _id: desc.userId })
      : Accounts.findUserByEmail(desc.email)

    if (req.body.assignee) {
      const assigneeUser = getUserByDesc(req.body.assignee)
      editObj.assigned_to = assigneeUser.bugzillaCreds.login
    }

    if (req.body.involvedList) {
      const requestedUsers = req.body.involvedList.map(getUserByDesc)

      // Creating 2 full lists which will have overlapping users on both removed from both
      const involvedToRemove = caseItem.involvedList
      const involvedToAdd = requestedUsers.map(user => user.bugzillaCreds.login)

      involvedToAdd.slice().forEach((userLogin, addInd) => {
        const removeInd = involvedToRemove.indexOf(userLogin)

        if (removeInd !== -1) {
          involvedToRemove.splice(removeInd, 1)
          involvedToAdd.splice(addInd, 1)
        }
      })

      editObj.cc = {
        add: involvedToAdd,
        remove: involvedToRemove
      }
    }
  }
  try {
    caseEditor(parseInt(params.id), editObj, user._id)
    res.send(200)
  } catch (e) {
    res.send(400, e.message)
  }
}, makeComposedExtractor(bodyExtractor, headerExtractor))
