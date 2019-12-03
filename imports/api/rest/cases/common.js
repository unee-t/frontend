// @flow
import { Meteor } from 'meteor/meteor'
import UnitRolesData, { addUserToRole, roleEnum } from '../../unit-roles-data'
import { factoryOptions, idUrlTemplate, transformCaseForClient } from '../../cases'
import { Accounts } from 'meteor/accounts-base'
import { KEEP_DEFAULT } from '../../pending-invitations'
import { callAPI } from '../../../util/bugzilla-api'

type UserDoc = {
  _id: string,
  profile: {
    name?: string
  },
  emails: Array<{
    address: string
  }>
}

type UserTransformer = (user: UserDoc) => {
  userId?: string,
  name?: string,
  role?: ?string
}

type UnitMeta = {
  _id: string,
  bzId: string,
  ownerIds: Array<string>
}

export const caseAPIFields = [
  'product',
  'summary',
  'id',
  'assigned_to',
  'creation_time',
  'cf_ipi_clust_1_next_step',
  'cf_ipi_clust_1_next_step_date',
  'description',
  'cf_ipi_clust_1_solution',
  'deadline',
  'cc',
  'platform',
  'cf_ipi_clust_6_claim_type',
  'creator',
  'priority',
  'bug_severity'
]

export const makeUserAPIObjGenerator = (unitMongoId: string) => {
  const unitRolesDict = UnitRolesData.find({
    unitId: unitMongoId
  }, {
    fields: {
      'members.id': 1,
      roleType: 1
    }
  }).fetch().reduce((all, role) => {
    role.members.forEach(member => {
      all[member.id] = role.roleType
    })
    return all
  }, {})

  return (userDoc: UserDoc) => {
    const userObj = {}
    if (userDoc) {
      userObj.userId = userDoc._id
      userObj.name = userDoc.profile.name || userDoc.emails[0].address.split('@')[0]
      userObj.role = unitRolesDict[userDoc._id] || null
    }
    return userObj
  }
}

export const tranformCaseAPIObj = (bug: any, thisUser: { _id: string }, transformUserObj: UserTransformer) => {
  const {
    product,
    id,
    assigned_to: assignedTo,
    assigned_to_detail: a,
    cc,
    cc_detail: b,
    creator,
    creator_detail: c,
    creation_time: creationTime,
    ...relevantBugFields
  } = bug
  const userRelevance = []
  const assigneeObj = transformUserObj(Meteor.users.findOne({ 'bugzillaCreds.login': assignedTo }))
  if (thisUser._id === assigneeObj.userId) {
    userRelevance.push('Assignee')
  }

  const reporterObj = transformUserObj(Meteor.users.findOne({ 'bugzillaCreds.login': creator }))
  if (thisUser._id === reporterObj.userId) {
    userRelevance.push('Reporter')
  }

  const involvedList = cc.map(ccItem => transformUserObj(Meteor.users.findOne({ 'bugzillaCreds.login': ccItem })))
  if (involvedList.some(involved => involved.userId === thisUser._id)) {
    userRelevance.push('Invited To')
  }
  return {
    assignee: assigneeObj,
    reporter: reporterObj,
    caseId: id,
    involvedList,
    userRelevance,
    creationTime,
    ...transformCaseForClient(relevantBugFields)
  }
}

export const attemptUserGeneration = (newUserEmail: string, creator: UserDoc) => {
  const existingUser = Accounts.findUserByEmail(newUserEmail)
  if (existingUser) {
    // logger.warn(`Creating user by alias ID '${newUserEmail}' failed, another user with this email address already exists`)
    return existingUser
  }
  const userId = Accounts.createUser({
    email: newUserEmail,
    profile: {
      isLimited: true,
      creatorId: creator._id
    }
  })

  Meteor.users.update({ _id: userId }, {
    $set: {
      'emails.0.verified': true,
      apiAliases: {
        userId: creator._id,
        id: newUserEmail
      }
    }
  })

  return Meteor.users.findOne({ _id: userId })
}

export const verifyRole = (
  invitor: UserDoc,
  invitee: UserDoc,
  unitMetaData: UnitMeta,
  designatedRole: string,
  errorLogParams: {}
) => {
  const existingAssigneeRole = UnitRolesData.findOne({ 'members.id': invitee._id, unitId: unitMetaData._id })
  if (!existingAssigneeRole) {
    if (!unitMetaData.ownerIds.includes(invitor._id)) {
      throw new Meteor.Error('The specified user doesn\'t have a role in this unit, and you are not allowed to invite it', 'client error')
    }
    if (!designatedRole) {
      throw new Meteor.Error('You must provide a role for the user, so it can be permitted access to this unit', 'client error')
    }

    try {
      addUserToRole(invitor, invitee, unitMetaData.bzId, designatedRole, KEEP_DEFAULT, false, errorLogParams)
    } catch (e) {
      throw new Meteor.Error(e.message, 'server error')
    }
  }
}

export const assigneeAllowedRoles:Array<mixed> = Object.values(roleEnum).filter(val => val !== roleEnum.CONTRACTOR)
export const isDateString = (str:string) => typeof str === 'string' && !isNaN((new Date(str)).getTime())

export const getCaseById = (id:number) => {
  const resp = callAPI('get', idUrlTemplate(id), { api_key: process.env.BUGZILLA_ADMIN_KEY }, false, true)
  return factoryOptions.dataResolver(resp.data)[0]
}
