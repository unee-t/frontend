import { Meteor } from 'meteor/meteor'

export const makeAssociationFactory = collectionName => (publisher, associateFn) => function (unitName) {
  const origAdded = this.added

  // Shadow overriding 'added' to add the 'join' logic
  this.added = (name, id, item) => {
    origAdded.call(this, name, id, item)
    if (name === collectionName) { // Should be obvious now, but just in case for future developments
      associateFn(item, (assocCollectionName, assocItemId, assocItem) => {
        origAdded.call(this, assocCollectionName, assocItemId, assocItem)
      })
    }
  }
  return publisher.call(this, unitName)
}

export const withUsers = loginNamesGetter => (publishedItem, addingFn) => Meteor.users.find({
  'bugzillaCreds.login': {$in: loginNamesGetter(publishedItem)}
}, {
  fields: {profile: 1, 'bugzillaCreds.login': 1}
}).forEach(user => {
  addingFn.call(this, 'users', user._id, user)
})
