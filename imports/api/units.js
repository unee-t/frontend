import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import publicationFactory from './base/rest-resource-factory'
import { makeAssociationFactory, withUsers } from './base/associations-helper'
import { callAPI } from '../util/bugzilla-api'

export const collectionName = 'units'

// TODO: TEST THIS STUFF!!! (but later)
export const factoryOptions = {
  collectionName,
  dataResolver: data => data.products
}

export const getUnitRoles = unit =>
  unit.components.reduce((all, {default_assigned_to: assigned, default_qa_contact: qaContact, name}) => {
    if (assigned) {
      all.push({
        login: assigned,
        role: name
      })
    }
    if (qaContact) {
      all.push({
        login: qaContact,
        role: name
      })
    }
    return all
  }, [])

if (Meteor.isServer) {
  const factory = publicationFactory(factoryOptions)
  const associationFactory = makeAssociationFactory(collectionName)

  Meteor.publish(`${collectionName}.byId`, associationFactory(
    factory.publishById({ // It would work exactly the same for the name according to the BZ API docs
      uriTemplate: unitName => ({
        url: '/rest/product',
        params: {names: unitName}
      })
    }),
    withUsers(unitItem => getUnitRoles(unitItem).map(u => u.login))
  ))

  Meteor.publish(`${collectionName}.forReporting`, function () {
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
