// @flow
import { Meteor } from 'meteor/meteor'
import { logger } from '../../../util/logger'
import type { Request, Response, NextFunc } from '../rest-types'

type Extractor = {
  func: (req:Request) => ?string,
  errorMsg: string
}
export const queryExtractor:Extractor = {
  func: req => req.query && req.query.apiKey,
  errorMsg: 'Must provide "apiKey" as a request query param'
}
export const bodyExtractor:Extractor = {
  func: req => req.body.apiKey,
  errorMsg: '"apiKey" must be provided in the request\'s body'
}
export const headerExtractor:Extractor = {
  func: req => {
    const authHeader = req.headers.Authorization || req.headers.authorization
    if (authHeader) {
      const match = authHeader.match(/Bearer (.+)/)
      if (match) return match[1]
    }
  },
  errorMsg: '"apiKey" must be provided in the request\'s headers as an "Authorization: Bearer..." token'
}
export const makeComposedExtractor = (...extractors: Array<Extractor>):Extractor => ({
  func: req => {
    let apiKey
    return extractors.some(ext => {
      apiKey = ext.func(req)
      return apiKey
    }) ? apiKey : null
  },
  errorMsg: 'The request must fulfill one of the following: ' + extractors.map(ext => ext.errorMsg).join('; ')
})

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
