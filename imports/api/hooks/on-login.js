import { Accounts } from 'meteor/accounts-base'
import { Meteor } from 'meteor/meteor'
import randToken from 'rand-token'
import { logger } from '../../util/logger'

// Enforces one-time usage of random generated passwords for newly invited users
Accounts.onLogin(info => {
  const { user } = info
  if (info.methodName === 'resetPassword') {
    Meteor.users.update(user._id, {
      $set: {
        'profile.isLimited': false
      }
    })
  } else if (info.type === 'password') {
    logger.info('info', info)
    if (user.profile.isLimited) {
      logger.info(`resetting the password for ${user.emails[0].address} after one-time usage by invitation`)
      const randPass = randToken.generate(12)
      Accounts.setPassword(user._id, randPass, { logout: false })
    }
  }
})
