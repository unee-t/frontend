// @flow
import { Meteor } from 'meteor/meteor'
import { logger } from '../../../util/logger'
import type { Request, Response, NextFunc } from '../rest-types'

type Extractor = {
  func: (req:Request) => string|null,
  errorMsg: string
}
export const queryExtractor:Extractor = {
  func: req => req.query && req.query.apiKey,
  errorMsg: 'Must provide "apiKey" as a request query param'
}
export const retrieveKey = (keyStr: string) => {
  const user = Meteor.users.findOne({
    'mefeApiKeys.key': keyStr
  })
  const obfuscatedKey = `${keyStr.slice(0, 3)}***${keyStr.slice(-3)}`
  if (!user) {
    logger.warn(`No user found for apiKey ${obfuscatedKey}`)
    throw new Error('No user found for the specified apiKey')
  }
  const relevantKey = user.mefeApiKeys.find(apiKeyRecord => apiKeyRecord.key === keyStr)
  if (relevantKey.revokedAt) {
    logger.warn(`Attempt to use revoked apiKey ${obfuscatedKey} for user ${user._id}`)
    throw new Error('The provided apiKey has been revoked')
  }

  return { relevantKey, user }
}

export default (next: NextFunc, extractor:Extractor = queryExtractor) => (req: Request, res: Response) => {
  const apiKey = extractor.func(req)
  if (!apiKey) {
    res.send(400, extractor.errorMsg)
    return
  }

  let result
  try {
    result = retrieveKey(apiKey)
  } catch (e) {
    res.send(400, e.message)
    return
  }

  const { relevantKey, user } = result

  Object.assign(req, {
    user,
    apiKeyDetails: relevantKey
  })

  next(req, res)
}
