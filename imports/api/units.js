import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import publicationFactory from './base/rest-resource-factory'
import { callAPI } from '../util/bugzilla-api'

const collectionName = 'units'

// TODO: TEST THIS STUFF!!! (but later)
export const factoryOptions = {
  collectionName,
  dataResolver: data => data.products
}

export const getUnitRoles = unit =>
  unit.components.reduce((all, {default_assigned_to: assigned, default_qa_contact: qaContact, name}) => {
    if (assigned) {
      all.push({
        email: assigned,
        role: name
      })
    }
    if (qaContact) {
      all.push({
        email: qaContact,
        role: name
      })
    }
    return all
  }, [])

if (Meteor.isServer) {
  const factory = publicationFactory(factoryOptions)

  // TODO: refactor this out so it could be used for others resources too
  const associationFactory = (publisher, associateFn) => function (unitName) {
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

  Meteor.publish('unit', associationFactory(
    factory.publishById({ // It would work exactly the same for the name according to the BZ API docs
      uriTemplate: unitName => ({
        url: '/rest/product',
        params: {names: unitName}
      })
    }),
    (unitItem, addingFn) => {
      Meteor.users.find({
        'bugzillaCreds.login': {$in: getUnitRoles(unitItem).map(u => u.email)}
      }, {
        fields: {profile: 1, 'bugzillaCreds.login': 1}
      }).forEach(user => {
        addingFn.call(this, 'users', user._id, user)
      })
    }
  ))

  Meteor.publish('unitsForReporting', function () {
    let ids
    if (this.userId) {
      const { bugzillaCreds: { token } } = Meteor.users.findOne(this.userId)
      try {
        const listResponse = callAPI('get', '/rest/product_enterable', {token}, false, true)
        ids = listResponse.data.ids
      } catch (e) {
        console.error('API error encountered', 'unitsForReporting', this.userId)
        this.ready()
        this.error(new Meteor.Error({message: 'REST API error', origError: e}))
      }
    }
    factory.publishById({ // It would work exactly the same for the name according to the BZ API docs
      uriTemplate: ids => {
        const idsQueryParams = ids.map(id => `ids=${id}&`).join('')
        return `/rest/product?${idsQueryParams}`
      }
    }).call(this, ids || [])
  })
}

let Units
if (Meteor.isClient) {
  Units = new Mongo.Collection(collectionName)
}
export default Units
