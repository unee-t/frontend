import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import randToken from 'rand-token'

import AccessInvitations from './access-invitations'

export const makeMatchingUser = bzUser => {
  const regUser = Meteor.users.findOne({'bugzillaCreds.login': bzUser.login})
  return regUser ? Object.assign({}, bzUser, regUser.profile) : bzUser
}

if (Meteor.isServer) {
  Meteor.publish('users.myBzLogin', function () {
    if (!this.userId) {
      this.ready()
      this.error(new Meteor.Error({message: 'Authentication required'}))
      return false
    }
    return Meteor.users.find({_id: this.userId}, {
      fields: {
        'bugzillaCreds.login': 1
      }
    })
  })
}

Meteor.methods({
  'users.invitationLogin': function (code) {
    if (Meteor.isServer) {
      // Reusable matcher object for the next mongo queries
      const codeMatcher = {
        receivedInvites: {
          $elemMatch: {
            accessToken: code
          }
        }
      }

      // Finding the user for this invite code (and checking whether one-click login is still allowed for it)
      const invitedUser = Meteor.users.findOne(Object.assign({
        'profile.isLimited': true
      }, codeMatcher), {
        fields: Object.assign({
          emails: 1
        }, codeMatcher)
      })
      if (!invitedUser) {
        console.log('The code is invalid or login is required first')
        throw new Meteor.Error('The code is invalid or login is required first')
      }

      // Track accesses
      AccessInvitations.upsert({
        userId: invitedUser._id,
        unitId: invitedUser.receivedInvites[0].unitId
      }, {
        $set: {
          userId: invitedUser._id,
          unitId: invitedUser.receivedInvites[0].unitId
        },
        $push: {
          dates: new Date()
        }
      })

      // Keeping track of how many times the user used this invitation to access the system
      Meteor.users.update({
        _id: invitedUser._id,
        'receivedInvites.accessToken': code
      }, {
        $inc: {
          'receivedInvites.$.accessedCount': 1
        }
      })
      console.log(`${invitedUser.emails[0].address} is using an invitation to access the system`)

      // Resetting the password to something new the client-side could use for an automated login
      const randPass = randToken.generate(12)
      Accounts.setPassword(invitedUser._id, randPass, {logout: true})

      const invitedByDetails = (() => {
        const { emails: [{ address: email }], profile: { name } } =
          Meteor.users.findOne(invitedUser.receivedInvites[0].invitedBy)
        return {
          email,
          name
        }
      })()
      return {
        email: invitedUser.emails[0].address,
        pw: randPass,
        caseId: invitedUser.receivedInvites[0].caseId,
        invitedByDetails
      }
    }
  },
  'users.updateMyName': function (name) {
    if (!Meteor.user()) return new Meteor.Error('Must be logged in')
    if (!name || name.length < 2) return new Meteor.Error('Name should be of minimum 2 characters')

    Meteor.users.update(Meteor.userId(), {
      $set: {'profile.name': name}
    })
  }
})
