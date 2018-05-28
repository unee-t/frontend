import { Meteor } from 'meteor/meteor'
import _ from 'lodash'

export const makeAssociationFactory = collectionName => (publisher, associateFn) => function (unitName) {
  const origAdded = this.added

  // Shadow overriding 'added' to add the 'join' logic
  this.added = (name, id, item) => {
    origAdded.call(this, name, id, item)
    if (name === collectionName) { // Should be obvious now, but just in case for future developments
      associateFn(item, (assocCollectionName, assocItemId, assocItem) => {
        origAdded.call(this, assocCollectionName, assocItemId, assocItem)
      }, this)
    }
  }
  return publisher.call(this, unitName)
}

export const withUsers = (loginNamesGetter, customQuery = _.identity, customProj = _.identity) =>
  (publishedItem, addingFn, subHandle) => {
    const cursor = Meteor.users.find(customQuery({
      'bugzillaCreds.login': {$in: loginNamesGetter(publishedItem)}
    }, publishedItem), {
      fields: customProj({'profile.name': 1, 'bugzillaCreds.login': 1, 'emails.address': 1}, publishedItem)
    })

    // Observing changes to the cursor in case the users are added or changed while the sub is still live
    const handle = cursor.observeChanges({
      added: (id, userFields) => {
        addingFn('users', id, userFields)
      },
      changed: (id, userFields) => {
        subHandle.changed('users', id, userFields)
      }
      // TODO: Consider implementing "removed" for cases where users are disassociated with an entity
    })
    cursor.forEach(user => {
      addingFn('users', user._id, user)
    })

    subHandle.onStop(() => handle.stop())
  }
