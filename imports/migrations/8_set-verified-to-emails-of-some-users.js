import { Meteor } from 'meteor/meteor'
import { Migrations } from 'meteor/percolate:migrations'

const makeUserEmailVerified = user => {
  Meteor.users.update({
    _id: user._id
  }, {
    $set: {
      'emails.0.verified': true,
      'emails.0.wasVerifiedBefore8': user.emails[0].verified
    }
  })
}

Migrations.add({
  version: 8,
  up: () => {
    Meteor.users.find({
      receivedInvites: {
        $exists: false
      }
    }).forEach(makeUserEmailVerified)
    Meteor.users.find({
      'receivedInvites.accessedCount': {
        $gt: 0
      }
    }).forEach(makeUserEmailVerified)
  },
  down: () => {
    Meteor.users.find().forEach(user => {
      if (typeof user.emails[0].wasVerifiedBefore8 !== 'undefined') {
        Meteor.users.update({
          _id: user._id
        }, {
          $set: {
            'emails.0.verified': !!user.emails[0].wasVerifiedBefore8
          },
          $unset: {
            'emails.0.wasVerifiedBefore8': 1
          }
        })
      }
    })
  }
})
