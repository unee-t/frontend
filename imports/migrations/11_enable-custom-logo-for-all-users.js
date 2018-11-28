import { Meteor } from 'meteor/meteor'
import { Migrations } from 'meteor/percolate:migrations'

Migrations.add({
  version: 11,
  up: () => {
    Meteor.users.update({}, {
      $set: {
        'customReportLogoEnabled': true
      }
    }, {
      multi: true
    })
  },
  down: () => {
    Meteor.users.update({}, {
      $unset: {
        'customReportLogoEnabled': 1
      }
    }, {
      multi: true
    })
  }
})
