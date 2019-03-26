import { Accounts } from 'meteor/accounts-base'
import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { logger } from '../../util/logger'
import { createUnitItem } from '../units'
import { inviteUserToRole } from '../unit-roles-data'
import UnitMetaData from '../unit-meta-data'

function createUnitHandler (payload, res) {
  const {
    creatorId, name, type, moreInfo, streetAddress, city, state, zipCode, country, ownerId
  } = payload
  let result
  try {
    result = createUnitItem(creatorId, name, type, moreInfo, streetAddress, city, state, zipCode, country, ownerId, {
      apiRequestType: 'CREATE_UNIT',
      payload
    })
    res.send(201, {
      unitMongoId: result.unitMongoId,
      timestamp: (new Date()).toISOString()
    })
  } catch (e) {
    logger.error(`An error occurred while processing a CREATE_UNIT API payload request: '${e.message}'`)
    res.send(400, e.message)
  }
  if (result) {
    result.liveUpdateFunc()
  }
}

function createUserHandler (payload, res) {
  const {
    creatorId, emailAddress, firstName, lastName, phoneNumber
  } = payload
  try {
    check(emailAddress, String, 'emailAddress must be a string')
    const existingUser = Accounts.findUserByEmail(emailAddress)
    if (existingUser) {
      res.send(200, {
        userId: existingUser._id,
        isCreator: existingUser.profile.creatorId === creatorId,
        timestamp: existingUser.createdAt.toISOString()
      })
      return
    }
    const profileObj = {
      isLimited: true
    }
    if (firstName) {
      check(firstName, String, 'firstName must be a String')
      profileObj.firstName = firstName
    }
    if (lastName) {
      check(lastName, String, 'lastName must be a String')
      profileObj.lastName = lastName
    }
    if (firstName || lastName) {
      profileObj.name = (firstName ? firstName + ' ' : '') + (lastName || '')
    }
    if (phoneNumber) {
      check(phoneNumber, String, 'phoneNumber must be a String')
      profileObj.phoneNumber = phoneNumber
    }
    const userObject = {
      email: emailAddress,
      profile: profileObj
    }
    if (creatorId) {
      const creator = Meteor.users.findOne({ _id: creatorId })
      if (!creator) {
        throw new Meteor.Error(`The provided creator Id '${creatorId}' doesn't match any current user's id in Mongo`)
      }
      profileObj.creatorId = creatorId
    }
    const userId = Accounts.createUser(userObject)
    res.send(201, {
      userId,
      isCreator: true,
      timestamp: (new Date()).toISOString()
    })
  } catch (e) {
    logger.error(`An error occurred while processing a CREATE_USER API payload request: '${e.message}'`)
    res.send(400, e.message)
  }
}

function assignRoleHandler (payload, res) {
  // Handling faulty boolean values sent by the API consumer and coercing them to be normal boolean values
  Object.assign(payload, {
    isOccupant: !!payload.isOccupant,
    isVisible: !!payload.isVisible,
    isDefaultInvited: !!payload.isDefaultInvited,
    isDefaultAssignee: !!payload.isDefaultAssignee,
    roleVisibility: Object.keys(payload.roleVisibility).reduce((all, key) => {
      all[key] = !!payload.roleVisibility[key]
      return all
    }, {})
  })

  const {
    requestorUserId, addedUserId, unitId, roleType, isOccupant, isVisible, isDefaultInvited, roleVisibility, isDefaultAssignee
  } = payload

  const errorLog = 'API payload request for ASSIGN_ROLE failed: '
  const inviteeUser = Meteor.users.findOne({ _id: addedUserId })
  if (!inviteeUser) {
    const message = `No user found for addedUserId ${addedUserId}`
    logger.log(errorLog + message)
    res.send(400, message)
    return
  }

  const unitMetaData = UnitMetaData.findOne({ _id: unitId })
  if (!unitMetaData) {
    const message = `No unit found for id '${unitId}'`
    logger.log(errorLog + message)
    res.send(400, message)
    return
  }
  if (!unitMetaData.ownerIds.includes(requestorUserId)) {
    const message = `requestorUserId ${requestorUserId} is not an owner of unit ${unitId} and not allowed to assign roles`
    logger.log(errorLog + message)
    res.send(403, message)
    return
  }
  try {
    inviteUserToRole(
      requestorUserId, unitId, inviteeUser, roleType, isOccupant, isVisible, isDefaultInvited, roleVisibility, isDefaultAssignee, {
        apiRequestType: 'ASSIGN_ROLE',
        payload
      }
    )
  } catch (e) {
    logger.log(errorLog + e.message)
    res.send(400, e.message)
    return
  }

  logger.log(`API payload request success for ASSIGN_ROLE: user ${addedUserId} assigned as ${roleType} in unit ${unitId}`)
  res.send(200, {
    timestamp: (new Date()).toISOString()
  })
}

export default (req, res) => {
  if (req.query.accessToken !== process.env.API_ACCESS_TOKEN) {
    res.send(401)
    return
  }

  // Helps to ignore null values
  const payload = Object.keys(req.body).reduce((all, key) => {
    if (req.body[key] !== null) {
      all[key] = req.body[key]
    }
    return all
  }, {})

  switch (payload.actionType) {
    case 'CREATE_UNIT':
      createUnitHandler(payload, res)
      break
    case 'CREATE_USER':
      createUserHandler(payload, res)
      break
    case 'ASSIGN_ROLE':
      assignRoleHandler(payload, res)
      break
    default:
      const message = `Unrecognized actionType ${payload.actionType}`
      res.send(400, message)
      logger.log(message)
  }
}
