import { Meteor } from 'meteor/meteor'
import { logger } from '../../../util/logger'

export default next => (req, res) => {
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

  Object.assign(req, {
    user,
    apiKeyDetails: relevantKey
  })

  next(req, res)
}
