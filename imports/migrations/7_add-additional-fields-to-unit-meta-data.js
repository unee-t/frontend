import { Meteor } from 'meteor/meteor'
import { Migrations } from 'meteor/percolate:migrations'

import UnitMetaData from '../api/unit-meta-data'

Migrations.add({
  version: 7,
  up: () => {
    UnitMetaData.update({}, {
      $set: {
        createdAt: new Date(),
        ownerIds: [],
        moreInfo: '',
        unitType: null
      }
    }, {
      multi: true
    })
  },
  down: () => {
    Meteor.users.update({}, {
      $unset: {
        createdAt: 1,
        ownerIds: 1,
        moreInfo: 1,
        unitType: 1
      }
    }, {
      multi: true
    })
  }
})
