import { Meteor } from 'meteor/meteor'
import { Migrations } from 'meteor/percolate:migrations'

Migrations.add({
  version: 2,
  up: () => {
    Meteor.users.update({}, {
      $rename: {
        'invitedToCases': 'receivedInvites'
      }
    }, {
      multi: true
    })
  },
  down: () => {
    Meteor.users.update({}, {
      $rename: {
        'receivedInvites': 'invitedToCases'
      }
    }, {
      multi: true
    })
  }
})
