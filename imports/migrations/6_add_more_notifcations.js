import { Meteor } from 'meteor/meteor'
import { Migrations } from 'meteor/percolate:migrations'

Migrations.add({
  version: 6,
  up: () => {
    Meteor.users.update({}, {
      $set: {
        'notificationSettings.caseNewMessage': true,
        'notificationSettings.caseUpdate': true
      }
    }, {
      multi: true
    })
  },
  down: () => {
    Meteor.users.update({}, {
      $unset: {
        'notificationSettings.caseNewMessage': 1,
        'notificationSettings.caseUpdate': 1
      }
    }, {
      multi: true
    })
  }
})
