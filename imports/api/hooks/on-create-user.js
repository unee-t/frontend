import { Accounts } from 'meteor/accounts-base'
import { Meteor } from 'meteor/meteor'
import { HTTP } from 'meteor/http'
import randToken from 'rand-token'
import bugzillaApi from '../../util/bugzilla-api'
import { baseUserSchema } from '../custom-users'
import { logger } from '../../util/logger'
import PromoCodes from '../promo-codes'

// Exported for testing purposes
export function onCreateUser (options, user) {
  const { callAPI } = bugzillaApi
  const { bzLogin, bzPass, promoCode } = options.profile
  delete options.profile.bzLogin
  delete options.profile.bzPass

  if (promoCode) {
    const promoCodeRecord = PromoCodes.findOne({ code: new RegExp(promoCode.toLowerCase(), 'i') })
    if (!promoCodeRecord) {
      throw new Meteor.Error('Promo code does not exist')
    } else if (promoCodeRecord.expiresOn && promoCodeRecord.expiresOn.getTime() < Date.now()) {
      throw new Meteor.Error('This promo code has expired')
    }
  }

  // Creating a random bz pass if one was not provided
  const password = bzPass || 'a' + randToken.generate(10) + '!'
  const { email } = options
  const customizedUser = Object.assign({
    tac: {
      acceptedAt: new Date(),
      version: '08/06/2018'
    },
    bugzillaCreds: {
      login: bzLogin || email,
      password: bzPass ? null : password
    }
  }, user)

  // Checking if there's an existing bz user, or creating one
  let apiResult
  try {
    if (!bzLogin && !bzPass) {
      apiResult = callAPI('post', '/rest/user', { email, password }, true, true)
    } else {
      apiResult = callAPI('get', '/rest/login', { login: bzLogin, password: bzPass }, false, true)
    }
  } catch (e) {
    logger.error(e)
    throw new Meteor.Error({ message: 'REST API error', origError: e })
  }
  const { id: userId } = apiResult.data
  const userApiKey = randToken.generate(16)
  try {
    HTTP.call('POST', process.env.APIENROLL_LAMBDA_URL, {
      data: {
        userApiKey,
        userId: userId.toString()
      },
      headers: {
        Authorization: `Bearer ${process.env.API_ACCESS_TOKEN}`
      }
    })
  } catch (e) {
    logger.error({
      endpoint: process.env.APIENROLL_LAMBDA_URL,
      method: 'POST',
      error: e,
      userId
    })
    throw new Meteor.Error('Lambda REST API error', e.message, { lambdaStatusCode: e.response.statusCode })
  }
  Object.assign(customizedUser.bugzillaCreds, {
    apiKey: userApiKey,
    id: userId
  })
  customizedUser.profile = options.profile
  Object.assign(customizedUser, baseUserSchema)
  logger.info(`User for ${email} was created successfully`)
  return customizedUser
}
if (Meteor.isServer) {
  Accounts.onCreateUser(onCreateUser)
}
