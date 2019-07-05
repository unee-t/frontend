import { Accounts } from 'meteor/accounts-base'
import { Meteor } from 'meteor/meteor'
import { logger } from '../../util/logger'
import otplib from 'otplib'

otplib.authenticator.options = {
  step: 30,
  window: 1
}

Accounts.registerLoginHandler('otp', (options) => {
  const user = Meteor.users.findOne({ _id: options.userId })
  const baseError = `OTP login failed: User ${options.userId}`
  if (!user) {
    logger.warn(`${baseError} was not found`)
    throw new Meteor.Error(403, 'The specified user was not found')
  }

  if (!user.services || !user.services.otp) {
    logger.warn(`${baseError} was not registered for OTP login`)
    throw new Meteor.Error(403, 'Please request a valid OTP before using this login method')
  }

  // Removing the otp object from services, as it won't be needed any further- it's for one time use only
  Meteor.users.update({ _id: user._id }, {
    $unset: {
      'services.otp': 1
    }
  })

  // Checking token's match with the stored secret
  if (!otplib.authenticator.check(options.otpToken, user.services.otp.secret)) {
    logger.warn(`${baseError} failed OTP check with token ${options.otpToken}`)
    throw new Meteor.Error(403, 'The OTP doesn\'t match. Please try again')
  }

  if ((new Date()) - user.services.otp.generatedAt > 35e3) { // 30 seconds to match the OTP expiry + 5 seconds grace period
    logger.warn(`${baseError} tried using an OTP for an expired secret`)
    throw new Meteor.Error(403, 'The OTP used is no longer valid. Please request a new one')
  }

  return { userId: user._id }
})
