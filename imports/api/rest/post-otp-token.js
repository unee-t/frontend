// @flow
import { Meteor } from 'meteor/meteor'
import userApiKey, { retrieveKey } from './middleware/user-api-key-middleware'
import { logger } from '../../util/logger'
import otplib from 'otplib'

import type { Request, Response } from './rest-types'

export default userApiKey((req: Request, res: Response) => {
  const { creatorApiKey } = req.body
  if (!creatorApiKey) {
    res.send(400, '"ownerApiKey" must be provided in the request\'s body')
    return
  }
  let result
  try {
    result = retrieveKey(creatorApiKey)
  } catch (e) {
    res.send(400, e.message)
    return
  }

  const { user: ownerUser } = result

  if (req.user.profile.creatorId !== ownerUser._id) {
    logger.warn(`Request to generate otp was rejected for user ${req.user._id} since ${ownerUser._id} is not its creator`)
    res.send(400, 'The provided ownerApiKey isn\'t associated with the real creator of the user associated with the provided userApiKey')
    return
  }

  const otpSecret = otplib.authenticator.generateSecret()
  Meteor.users.update({
    _id: req.user._id
  }, {
    $set: {
      'services.otp': {
        secret: otpSecret,
        generatedAt: new Date()
      }
    }
  })

  const token = otplib.authenticator.generate(otpSecret)

  res.send(200, { token, userId: req.user._id })
}, {
  func: req => req.body.userApiKey,
  errorMsg: '"userApiKey" must be provided in the request\'s body'
})
