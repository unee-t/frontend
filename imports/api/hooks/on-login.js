import { Accounts } from 'meteor/accounts-base'
import randToken from 'rand-token'

// Enforces one-time usage of random generated passwords for newly invited users
Accounts.onLogin(info => {
  if (info.type === 'password') {
    console.log('info', info)
    const { user } = info
    if (user.profile.isLimited) {
      console.log(`resetting the password for ${user.emails[0].address} after one-time usage by invitation`)
      const randPass = randToken.generate(12)
      Accounts.setPassword(user._id, randPass, {logout: false})
    }
  }
})
