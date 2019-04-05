import { Accounts } from 'meteor/accounts-base'
import { Meteor } from 'meteor/meteor'
import { check, Match } from 'meteor/check'
import countries from 'iso-3166-1-codes'
import { logger } from '../../util/logger'
import { createUnitItem } from '../units'
import { inviteUserToRole, removeRoleMember } from '../unit-roles-data'
import UnitMetaData, { unitTypes } from '../unit-meta-data'
import { callAPI } from '../../util/bugzilla-api'
import { emailValidator } from '../../util/validators'

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

function editUserHandler (payload, res) {
  const {
    requestorUserId, userId, creatorId, emailAddress, bzfeEmailAddress, firstName, lastName, phoneNumber
  } = payload

  const errorLog = 'API payload request for EDIT_USER failed: '
  const attrErrors = []
  const requestor = Meteor.users.findOne(requestorUserId)
  if (!requestor) {
    attrErrors.push(`No user found for requestorUserId ${requestorUserId}`)
  }

  const editee = Meteor.users.findOne(userId)
  if (!editee) {
    attrErrors.push(`No user found for user to edit userId ${userId}`)
  }

  if ([creatorId, emailAddress, bzfeEmailAddress, firstName, lastName, phoneNumber].every(attr => !attr)) {
    attrErrors.push('No attribute was provided for modifying the specified user')
  }

  if (creatorId) {
    const newCreator = Meteor.users.findOne({ _id: creatorId })
    if (!newCreator) {
      attrErrors.push(`No user found for proposed creatorId ${creatorId}`)
    }
  }

  if (emailAddress && !emailValidator(emailAddress)) {
    attrErrors.push(`emailAddress ${emailAddress} is not a valid email address`)
  }

  if (bzfeEmailAddress && !emailValidator(bzfeEmailAddress)) {
    attrErrors.push(`emailAddress ${emailAddress} is not a valid email address`)
  }

  if (attrErrors.length) {
    const errorsString = attrErrors.join('; ')
    logger.log(errorLog + errorsString)
    res.send(400, errorsString)
    return
  }

  if (requestorUserId !== userId && editee.profile.creatorId !== requestorUserId) {
    const message = `requestorUserId ${requestorUserId} isn't the creator of userId ${userId}, so it is prohibited from modifying it`
    logger.log(errorLog + message)
    res.send(403, message)
    return
  }

  // Editing user's profile object
  const profileEditObj = [
    ['creatorId', creatorId],
    ['firstName', firstName],
    ['lastName', lastName],
    ['phoneNumber', phoneNumber]
  ].reduce((obj, attrDef) => {
    if (attrDef[1]) {
      obj[`profile.${attrDef[0]}`] = attrDef[1]
    }
    return obj
  }, {})
  if (firstName && lastName) {
    profileEditObj['profile.name'] = `${firstName} ${lastName}`
  } else if (firstName) {
    profileEditObj['profile.name'] = `${firstName}${editee.profile.lastName ? ' ' + editee.profile.lastName : ''}`
  } else if (lastName) {
    profileEditObj['profile.name'] = `${editee.profile.firstName ? editee.profile.firstName + ' ' : ''}${lastName}`
  }
  if (Object.keys(profileEditObj).length) {
    Meteor.users.update({ _id: userId }, {
      $set: profileEditObj
    })
  }

  // Editing user's email address
  if (emailAddress) {
    Accounts.removeEmail(userId, editee.emails[0].address)
    Accounts.addEmail(userId, emailAddress)
  }

  // Editing user's BZ login email address
  if (bzfeEmailAddress) {
    try {
      callAPI('put', `/rest/user/${editee.bugzillaCreds.id}`, {
        email: bzfeEmailAddress
      }, true, true)
    } catch (e) {
      const message = `BZ API request for email address modification failed: ${JSON.stringify(e)}`
      logger.error(errorLog + message)
      res.send(500, message)
      return
    }

    Meteor.users.update({ _id: userId }, {
      $set: {
        'bugzillaCreds.login': bzfeEmailAddress
      }
    })
  }

  res.send(200, {
    timestamp: (new Date()).toISOString()
  })
}

function editUnitHandler (payload, res) {
  const errorLog = 'API payload request for EDIT_UNIT failed: '
  try {
    check(payload, Match.ObjectIncluding({
      requestorUserId: String,
      unitId: String,
      creatorId: Match.Maybe(String),
      type: Match.Maybe(String),
      name: Match.Maybe(String),
      moreInfo: Match.Maybe(String),
      streetAddress: Match.Maybe(String),
      city: Match.Maybe(String),
      state: Match.Maybe(String),
      zipCode: Match.Maybe(String),
      country: Match.Maybe(String)
    }))
  } catch (e) {
    logger.warn(errorLog + e.message)
    res.send(400, e.message)
    return
  }

  const {
    requestorUserId, unitId, creatorId, type, name, moreInfo, streetAddress, city, state, zipCode, country
  } = payload

  const metaData = UnitMetaData.findOne(unitId)
  if (!metaData) {
    const message = `No unit found for unitId ${unitId}`
    logger.warn(errorLog + message)
    res.send(400, message)
    return
  }
  if (metaData.creatorId !== requestorUserId && !metaData.ownerIds.includes(requestorUserId)) {
    const message = `requestorUserId ${requestorUserId} is not allowed to edit unit ${unitId}`
    logger.warn(errorLog + message)
    res.send(403, message)
    return
  }

  if (creatorId) {
    const creator = Meteor.users.findOne({ _id: creatorId })
    if (!creator) {
      const message = `No user found for creatorId ${creatorId}`
      logger.warn(errorLog + message)
      res.send(400, message)
      return
    }
  }

  if (type && !unitTypes.some(({ name }) => name === type)) {
    const message = `Unrecognized unit type of ${type}, please use one of the existing values`
    logger.warn(errorLog + message)
    res.send(400, message)
    return
  }

  if (country && !countries.some(({ name }) => name === country)) {
    const message = `Unrecognized country name of ${country}. Please use the country's name as mentioned in the ISO-3166 standard`
    logger.warn(errorLog + message)
    res.send(400, message)
    return
  }

  const attrObj = {
    unitType: type,
    displayName: name,
    moreInfo,
    streetAddress,
    city,
    zipCode,
    state,
    country,
    creatorId
  }

  const updateObj = Object.keys(attrObj).reduce((all, key) => {
    if (attrObj[key]) {
      all[key] = attrObj[key]
    }
    return all
  }, {})

  UnitMetaData.update({ _id: unitId }, { $set: updateObj })

  res.send(200, {
    timestamp: (new Date()).toISOString()
  })
}

function deassignRoleHandler (payload, res) {
  const errorLog = 'API payload request for DEASSIGN_ROLE failed: '
  try {
    check(payload, Match.ObjectIncluding({
      requestorUserId: String,
      userId: String,
      unitId: String
    }))
  } catch (e) {
    logger.warn(errorLog + e.message)
    res.send(400, e.message)
    return
  }

  const { requestorUserId, userId, unitId } = payload

  const unitMeta = UnitMetaData.findOne(unitId)
  if (!unitMeta) {
    const message = `No unit exists for unitId ${unitId}`
    logger.warn(errorLog + message)
    res.send(400, message)
    return
  }

  if (unitMeta.creatorId !== requestorUserId && !unitMeta.ownerIds.includes(requestorUserId)) {
    const message = `requestorUserId ${requestorUserId} is not allowed to modify roles on unitId ${unitId}`
    logger.warn(errorLog + message)
    res.send(403, message)
    return
  }
  const userToRemove = Meteor.users.findOne({ _id: userId })
  if (!userToRemove) {
    const message = `No user found for userId ${userId}`
    logger.warn(errorLog + message)
    res.send(400, message)
    return
  }

  try {
    removeRoleMember(requestorUserId, unitMeta.bzId, userToRemove.emails[0].address, {
      apiRequestType: 'DEASSIGN_ROLE',
      payload
    })
  } catch (e) {
    logger.warn(errorLog + e.message)
    res.send(400, e.message)
    return
  }

  res.send(200, {
    timestamp: (new Date()).toISOString()
  })
}

function addUnitOwnerHandler (payload, res) {
  const errorLog = 'API payload request for ADD_UNIT_OWNER failed: '
  try {
    check(payload, Match.ObjectIncluding({
      requestorUserId: String,
      ownerId: String,
      unitId: String
    }))
  } catch (e) {
    logger.warn(errorLog + e.message)
    res.send(400, e.message)
    return
  }

  const { requestorUserId, ownerId, unitId } = payload
  const unitMeta = UnitMetaData.findOne({ _id: unitId })
  if (!unitMeta) {
    const message = `No unit found for unitId ${unitId}`
    logger.warn(errorLog + message)
    res.send(400, message)
    return
  }

  if (!unitMeta.ownerIds.includes(requestorUserId) && unitMeta.creatorId !== requestorUserId) {
    const message = `The requestorUserId ${requestorUserId} is not an owner or creator of unitId ${unitId}`
    logger.warn(errorLog + message)
    res.send(403, message)
    return
  }

  if (unitMeta.ownerIds.includes(ownerId)) {
    res.send(200, {
      timestamp: (new Date()).toISOString(),
      additionalInfo: `The ownerId ${ownerId} is already an owner of unitId ${unitId}, and doesn't need to be added`
    })
    return
  }

  const newOwnerUser = Meteor.users.findOne({ _id: ownerId })
  if (!newOwnerUser) {
    const message = `No user found for ownerId ${ownerId}`
    logger.warn(errorLog + message)
    res.send(400, message)
    return
  }

  UnitMetaData.update({ _id: unitId }, {
    $push: {
      ownerIds: ownerId
    }
  })

  res.send(200, {
    timestamp: (new Date()).toISOString()
  })
}

function removeUnitOwnerHandler (payload, res) {
  const errorLog = 'API payload request for REMOVE_UNIT_OWNER failed: '
  try {
    check(payload, Match.ObjectIncluding({
      requestorUserId: String,
      ownerId: String,
      unitId: String
    }))
  } catch (e) {
    logger.warn(errorLog + e.message)
    res.send(400, e.message)
    return
  }

  const { requestorUserId, ownerId, unitId } = payload

  const unitMeta = UnitMetaData.findOne({ _id: unitId })
  if (!unitMeta) {
    const message = `No unit found for unitId ${unitId}`
    logger.warn(errorLog + message)
    res.send(400, message)
    return
  }

  if (!unitMeta.ownerIds.includes(requestorUserId) && unitMeta.creatorId !== requestorUserId) {
    const message = `The requestorUserId ${requestorUserId} is not an owner or creator of unitId ${unitId}`
    logger.warn(errorLog + message)
    res.send(403, message)
    return
  }
  const ownerUserToRemove = Meteor.users.findOne({ _id: ownerId })
  if (!ownerUserToRemove) {
    const message = `No user found for ownerId ${ownerId}`
    logger.warn(errorLog + message)
    res.send(400, message)
    return
  }

  if (!unitMeta.ownerIds.includes(ownerId)) {
    res.send(200, {
      timestamp: (new Date()).toISOString(),
      additionalInfo: `The ownerId ${ownerId} is not an owner of unitId ${unitId}, and doesn't need to be removed`
    })
    return
  }

  if (unitMeta.ownerIds.length === 1) {
    const message = `Can't remove the last remaining owner of unitId ${unitId}`
    logger.warn(errorLog + message)
    res.send(400, message)
    return
  }

  UnitMetaData.update({ _id: unitId }, {
    $pull: {
      ownerIds: ownerId
    }
  })

  res.send(200, {
    timestamp: (new Date()).toISOString()
  })
}

export default (req, res) => {
  if (req.query.accessToken !== process.env.API_ACCESS_TOKEN) {
    res.send(401, 'Invalid access token')
    return
  }

  const { actionType, ...innerPayload } = req.body
  // Helps to ignore null values
  const payload = Object.keys(innerPayload).reduce((all, key) => {
    if (req.body[key] !== null) {
      all[key] = req.body[key]
    }
    return all
  }, {})

  switch (actionType) {
    case 'CREATE_UNIT':
      createUnitHandler(payload, res)
      break
    case 'CREATE_USER':
      createUserHandler(payload, res)
      break
    case 'ASSIGN_ROLE':
      assignRoleHandler(payload, res)
      break
    case 'EDIT_UNIT':
      editUnitHandler(payload, res)
      break
    case 'EDIT_USER':
      editUserHandler(payload, res)
      break
    case 'DEASSIGN_ROLE':
      deassignRoleHandler(payload, res)
      break
    case 'ADD_UNIT_OWNER':
      addUnitOwnerHandler(payload, res)
      break
    case 'REMOVE_UNIT_OWNER':
      removeUnitOwnerHandler(payload, res)
      break
    default:
      const message = `Unrecognized actionType ${actionType}`
      res.send(400, message)
      logger.log(message)
  }
}
