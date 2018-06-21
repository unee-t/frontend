import { Meteor } from 'meteor/meteor'
import { Migrations } from 'meteor/percolate:migrations'
Migrations.add({
  version: 5,
  up: () => {
    Meteor.users.update({}, {
      $set: {
        notificationSettings: {
          assignedNewCase: true,
          assignedExistingCase: true,
          invitedToCase: true
        }
      }
    }, {
      multi: true
    })
  },
  down: () => {
    Meteor.users.update({}, {
      $unset: {
        notificationSettings: 1
      }
    }, {
      multi: true
    })
  }
})
