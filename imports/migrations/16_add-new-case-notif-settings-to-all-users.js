import { Meteor } from 'meteor/meteor'
import { Migrations } from 'meteor/percolate:migrations'

Migrations.add({
  version: 16,
  up: () => {
    Meteor.users.update({}, {
      $set: {
        'notificationSettings.assignedNewCase': true
      }
    }, {
      multi: true
    })
  },
  down: () => {
    Meteor.users.update({}, {
      $unset: {
        'notificationSettings.assignedNewCase': 1
      }
    }, {
      multi: true
    })
  }
})
