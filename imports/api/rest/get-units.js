import { Meteor } from 'meteor/meteor'
import { logger } from '../../util/logger'
import UnitMetaData from '../unit-meta-data'
import UnitRolesData from '../unit-roles-data'

export default (req, res) => {
  if (!req.query.apiKey) {
    res.send(400, 'Must provide "apiKey" as a request query param')
    return
  }
  const user = Meteor.users.findOne({
    'mefeApiKeys.key': req.query.apiKey
  })
  const obfuscatedKey = `${req.query.apiKey.slice(0, 3)}***${req.query.apiKey.slice(-3)}`
  if (!user) {
    logger.warn(`No user found for apiKey ${obfuscatedKey}`)
    res.send(400, 'No user found for the specified apiKey')
    return
  }
  const relevantKey = user.mefeApiKeys.find(apiKey => apiKey.key === req.query.apiKey)
  if (relevantKey.revokedAt) {
    logger.warn(`Attempt to use revoked apiKey ${obfuscatedKey} for user ${user._id}`)
    res.send(400, `The provided apiKey has been revoked`)
    return
  }

  const relevantRoles = UnitRolesData.find({
    'members.id': user._id
  }, {
    fields: {
      unitId: 1
    }
  }).fetch()

  const unitsData = UnitMetaData.find({
    _id: {
      $in: relevantRoles.map(role => role.unitId)
    }
  }, {
    fields: {
      city: 1,
      country: 1,
      createdAt: 1,
      displayName: 1,
      moreInfo: 1,
      state: 1,
      streetAddress: 1,
      unitType: 1,
      zipCode: 1
    }
  }).fetch()

  res.send(200, unitsData)
}
