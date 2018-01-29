import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import publicationFactory from './base/rest-resource-factory'

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

export let unitPublisher
if (Meteor.isServer) {
  const factory = publicationFactory(factoryOptions)
  const publisher = factory.publishById({ // It would work exactly the same for the name according to the BZ API docs
    uriTemplate: unitName => `/rest/product/${unitName}`
  })
  unitPublisher = function (unitName) {
    const origAdded = this.added

    // Shadow overriding 'added' to add the 'join' logic
    this.added = (name, id, item) => {
      origAdded.call(this, name, id, item)
      if (name === collectionName) { // Should be obvious now, but just in case for future developments
        Meteor.users.find({
          'bugzillaCreds.login': {$in: getUnitRoles(item).map(u => u.email)}
        }, {
          fields: {profile: 1, 'bugzillaCreds.login': 1}
        }).forEach(user => {
          origAdded.call(this, 'users', user._id, user)
        })
      }
    }
    return publisher.call(this, unitName)
  }
  Meteor.publish('unit', unitPublisher)
}

let Units
if (Meteor.isClient) {
  Units = new Mongo.Collection(collectionName)
}
export default Units
