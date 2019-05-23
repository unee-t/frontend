import { Accounts } from 'meteor/accounts-base'
import { Meteor } from 'meteor/meteor'
import randToken from 'rand-token'
import { logger } from '../../util/logger'

// Enforces one-time usage of random generated passwords for newly invited users
Accounts.onLogin(info => {
  const { user, ...rest } = info
  if (info.methodName === 'resetPassword') {
    logger.info(`User ${user.emails[0].address} has successfully reset their password`)
    if (user.profile.isLimited) {
      logger.info(`User ${user.emails[0].address} is no longer "limited" after password reset`)
      Meteor.users.update(user._id, {
        $unset: {
          'profile.isLimited': 1
        }
      })
    }
  } else if (info.type === 'password') {
    logger.info(`User with email ${user.emails[0].address} has logged in using a password`)
    if (user.profile.isLimited) {
      logger.info(`Resetting the password for ${user.emails[0].address} after one-time usage by invitation`)
      const randPass = randToken.generate(12)
      Accounts.setPassword(user._id, randPass, { logout: false })
    }
  } else if (rest.type !== 'resume') {
    logger.info(`User with email ${user.emails[0].address} has logged in using an alternative method`, rest)
  }
})
