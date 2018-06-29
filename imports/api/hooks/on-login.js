import { Accounts } from 'meteor/accounts-base'
import { Meteor } from 'meteor/meteor'
import randToken from 'rand-token'

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
    console.log('info', info)
    if (user.profile.isLimited) {
      console.log(`resetting the password for ${user.emails[0].address} after one-time usage by invitation`)
      const randPass = randToken.generate(12)
      Accounts.setPassword(user._id, randPass, {logout: false})
    }
  }
})
