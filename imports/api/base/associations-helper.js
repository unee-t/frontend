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
