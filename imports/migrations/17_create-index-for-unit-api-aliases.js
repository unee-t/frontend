import { Migrations } from 'meteor/percolate:migrations'
import UnitMetaData from '../api/unit-meta-data'

Migrations.add({
  version: 17,
  up: () => {
    UnitMetaData.rawCollection().createIndex({
      'apiAliases.userId': 1,
      'apiAliases.id': 1
    }, {
      unique: true,
      partialFilterExpression: {
        apiAliases: { $type: 'string' }
      }
    })
  },
  down: () => {
    UnitMetaData.rawCollection().dropIndex({
      'apiAliases.userId': 1,
      'apiAliases.id': 1
    }, {
      unique: true,
      partialFilterExpression: {
        apiAliases: { $type: 'string' }
      }
    })
  }
})
