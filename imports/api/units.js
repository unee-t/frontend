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

const makeInvitationMatcher = unitItem => ({
  invitedToCases: {
    $elemMatch: {
      unitId: unitItem.id
    }
  }
})

export const getUnitRoles = unit => {
  const invMatcher = makeInvitationMatcher(unit)
  invMatcher.invitedToCases.$elemMatch.done = true
  return _.uniqBy(
    unit.components.reduce((all, {default_assigned_to: assigned, name}) => { // Getting names from the unit's components
      if (assigned) {
        all.push({
          login: assigned,
          role: name
        })
      }
      return all
    }, []).concat(Meteor.users.find(
      invMatcher, // Getting more names of users with a finalized invitation to the unit
      Meteor.isServer ? { // Projection is only done on the server, as some features are not supported in Minimongo
        fields: Object.assign({
          'bugzillaCreds.login': 1
        }, invMatcher)
      } : {}
    ).fetch()
    // Mapping the users to the same interface as the first half of the array
      .map(({ invitedToCases: [{ role, isOccupant }], bugzillaCreds: { login } }) => ({
        login,
        role,
        isOccupant
      }))
    ),
    ({login}) => login // Filtering out duplicates in case a user shows up in a component and has a finalized invitation
  )
}

if (Meteor.isServer) {
  const factory = publicationFactory(factoryOptions)
  const associationFactory = makeAssociationFactory(collectionName)

  const makeUnitListPublisher = ({ apiUrl, funcName, additionalFields }) =>
    Meteor.publish(`${collectionName}.${funcName}`, function () {
      let ids
      if (this.userId) {
        const { bugzillaCreds: { apiKey } } = Meteor.users.findOne(this.userId)
        try {
          const listResponse = callAPI('get', apiUrl, {api_key: apiKey}, false, true)
          ids = listResponse.data.ids
        } catch (e) {
          console.error('API error encountered', `${collectionName}.${funcName}`, this.userId)
          this.ready()
          this.error(new Meteor.Error({message: 'REST API error', origError: e}))
        }
      }
      factory.publishById({ // It would work exactly the same for the name according to the BZ API docs
        uriTemplate: ids => {
          const idsQueryParams = ids.map(id => `ids=${id}&`).join('')
          return `/rest/product?${idsQueryParams}&include_fields=${['name,id'].concat(additionalFields).join(',')}`
        }
      }).call(this, ids || [])
    })

  const makeUnitWithUsersPublisher = ({ funcName, uriBuilder }) => {
    Meteor.publish(`${collectionName}.${funcName}`, associationFactory(
      factory.publishById({ // It would work exactly the same for the name according to the BZ API docs
        uriTemplate: uriBuilder
      }),
      withUsers(
        unitItem => getUnitRoles(unitItem).map(u => u.login),
        // Should rely both on completed invitations and unit information (which is why the "$or" is there)
        (query, unitItem) => ({$or: [makeInvitationMatcher(unitItem), query]}),
        (projection, unitItem) => Object.assign(makeInvitationMatcher(unitItem), projection)
      )
    ))
  }
  makeUnitWithUsersPublisher({
    funcName: 'byNameWithUsers',
    uriBuilder: unitName => ({
      url: '/rest/product',
      params: {names: unitName}
    })
  })
  makeUnitWithUsersPublisher({
    funcName: 'byIdWithUsers',
    uriBuilder: unitId => ({
      url: '/rest/product',
      params: {ids: unitId}
    })
  })
  makeUnitListPublisher({
    apiUrl: '/rest/product_enterable',
    funcName: 'forReporting',
    additionalFields: 'components'
  })
  makeUnitListPublisher({
    apiUrl: '/rest/product_selectable',
    funcName: 'forBrowsing',
    additionalFields: 'description'
  })
}

let Units
if (Meteor.isClient) {
  Units = new Mongo.Collection(collectionName)
}
export default Units
