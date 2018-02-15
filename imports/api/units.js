import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import publicationFactory from './base/rest-resource-factory'
import { makeAssociationFactory, withUsers } from './base/associations-helper'
import { callAPI } from '../util/bugzilla-api'
import _ from 'lodash'

export const collectionName = 'units'

// TODO: TEST THIS STUFF!!! (but later)
export const factoryOptions = {
  collectionName,
  dataResolver: data => data.products
}

export const getUnitRoles = unit => _.uniqBy(
  unit.components.reduce((all, {default_assigned_to: assigned, name}) => { // Getting names from the unit's components
    if (assigned) {
      all.push({
        login: assigned,
        role: name
      })
    }
    return all
  }, []).concat(Meteor.users.find({ // Getting more names of users with a finalized invitation to the unit
    invitedToCases: {
      $elemMatch: {
        unitId: unit.id,
        done: true
      }
    }
  }, Meteor.isServer ? { // Projection is only done on the server, as some features are not supported in Minimongo
    fields: {
      'invitedToCases.$': 1,
      'bugzillaCreds.login': 1
    }
  } : {}).fetch()
  // Mapping the users to the same interface as the first half of the array
    .map(({ invitedToCases: [{ role }], bugzillaCreds: { login } }) => ({
      login,
      role
    }))),
  ({login}) => login // Filtering out duplicates in case a user shows up in a component and has a finalized invitation
)

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
    withUsers(
      unitItem => getUnitRoles(unitItem).map(u => u.login),
      (query, unitItem) => Object.assign({
        invitedToCases: {
          $elemMatch: {
            unitId: unitItem.id
          }
        }
      }, query),
      (projection, unitItem) => Object.assign({
        'invitedToCases.$': 1
      }, projection)
    )
  ))

  Meteor.publish(`${collectionName}.forReporting`, function () {
    let ids
    if (this.userId) {
      const { bugzillaCreds: { token } } = Meteor.users.findOne(this.userId)
      try {
        const listResponse = callAPI('get', '/rest/product_enterable', {token}, false, true)
        ids = listResponse.data.ids
      } catch (e) {
        console.error('API error encountered', `${collectionName}.forReporting`, this.userId)
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
