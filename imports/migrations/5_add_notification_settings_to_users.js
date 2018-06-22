import { Meteor } from 'meteor/meteor'
import { Migrations } from 'meteor/percolate:migrations'

import { baseUserSchema } from '../api/custom-users'

Migrations.add({
  version: 5,
  up: () => {
    Meteor.users.update({}, {
      $set: baseUserSchema // This is the notification settings bit actually
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
