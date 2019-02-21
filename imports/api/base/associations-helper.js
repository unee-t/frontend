import { Meteor } from 'meteor/meteor'
import _ from 'lodash'

export const makeAssociationFactory = collectionName => (publisher, ...associateFns) => function (unitName) {
  const origAdded = this.added

  // Shadow overriding 'added' to add the 'join' logic
  this.added = (name, id, item) => {
    origAdded.call(this, name, id, item)
    if (name === collectionName) { // Should be obvious now, but just in case for future developments
      associateFns.forEach(associateFn => {
        associateFn(item, (assocCollectionName, assocItemId, assocItem) => {
          origAdded.call(this, assocCollectionName, assocItemId, assocItem)
        }, this)
      })
    }
  }
  return publisher.call(this, unitName)
}
export const withDocs = ({ cursorMaker, collectionName }) => (publishedItem, addingFn, subHandle) => {
  // Calling the cursor maker with the publishedItem and optional param of the userId for advanced queries
  const cursor = cursorMaker(publishedItem, subHandle.userId)

  // Observing changes to the cursor in case the users are added or changed while the sub is still live
  const handle = cursor.observeChanges({
    added: (id, docFields) => {
      addingFn(collectionName, id, docFields)
    },
    changed: (id, docFields) => {
      subHandle.changed(collectionName, id, docFields)
    }
    // TODO: Consider implementing "removed" for cases where docs are disassociated with an entity
  })
  cursor.forEach(doc => {
    addingFn(collectionName, doc._id, doc)
  })

  subHandle.onStop(() => handle.stop())
}

export const withUsers = (loginNamesGetter, customQuery = _.identity, customProj = _.identity) =>
  withDocs({
    cursorMaker: publishedItem => Meteor.users.find(
      customQuery({
        'bugzillaCreds.login': { $in: loginNamesGetter(publishedItem) }
      }, publishedItem), {
        fields: customProj({ 'profile.name': 1, 'bugzillaCreds.login': 1, 'emails.address': 1 }, publishedItem)
      }
    ),
    collectionName: 'users'
  })
