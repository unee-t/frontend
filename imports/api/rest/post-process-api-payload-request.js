import { Accounts } from 'meteor/accounts-base'
import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { logger } from '../../util/logger'
import { createUnitItem } from '../units'

function createUnitHandler (payload, res) {
  const {
    creatorId, name, type, moreInfo, streetAddress, city, state, zipCode, country, ownerId
  } = payload
  let result
  try {
    result = createUnitItem(creatorId, name, type, moreInfo, streetAddress, city, state, zipCode, country, ownerId)
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
      if (creatorId && existingUser.profile.creatorId === creatorId) {
        res.send(200, {
          userId: existingUser._id,
          timestamp: existingUser.createdAt.toISOString()
        })
        return
      } else {
        res.send(403, `Can't create a duplicate user for email "${emailAddress}"`)
      }
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
      timestamp: (new Date()).toISOString()
    })
  } catch (e) {
    logger.error(`An error occurred while processing a CREATE_USER API payload request: '${e.message}'`)
    res.send(400, e.message)
  }
}

export default (req, res) => {
  if (req.query.accessToken !== process.env.API_ACCESS_TOKEN) {
    res.send(401)
    return
  }

  const payload = req.body

  switch (payload.actionType) {
    case 'CREATE_UNIT':
      createUnitHandler(payload, res)
      break
    case 'CREATE_USER':
      createUserHandler(payload, res)
      break
    default:
      const message = `Unrecognized actionType ${payload.actionType}`
      res.send(400, message)
      logger.log(message)
  }
}
