import { Migrations } from 'meteor/percolate:migrations'
import { Meteor } from 'meteor/meteor'

Migrations.add({
  version: 18,
  up: () => {
    Meteor.users.rawCollection().createIndex({
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
    Meteor.users.rawCollection().dropIndex({
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
