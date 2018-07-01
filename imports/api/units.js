import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { HTTP } from 'meteor/http'
import { check } from 'meteor/check'
import randToken from 'rand-token'
import _ from 'lodash'
import publicationFactory from './base/rest-resource-factory'
import { makeAssociationFactory, withUsers } from './base/associations-helper'
import UnitMetaData, { unitTypes } from './unit-meta-data'
import UnitRolesData, { possibleRoles } from './unit-roles-data'
import PendingInvitations, { REPLACE_DEFAULT } from './pending-invitations'
import { callAPI } from '../util/bugzilla-api'

export const collectionName = 'units'

// TODO: TEST THIS STUFF!!! (but later)
export const factoryOptions = {
  collectionName,
  dataResolver: data => data.products
}

const makeInvitationMatcher = unitItem => ({
  receivedInvites: {
    $elemMatch: {
      unitId: unitItem.id
    }
  }
})

export const getUnitRoles = unit => {
  const invMatcher = makeInvitationMatcher(unit)
  invMatcher.receivedInvites.$elemMatch.done = true
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
      .map(({ receivedInvites: [{ role, isOccupant }], bugzillaCreds: { login } }) => ({
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
      if (ids.length === 0) {
        this.ready()
      } else {
        factory.publishById({ // It would work exactly the same for the name according to the BZ API docs
          uriTemplate: ids => {
            const idsQueryParams = ids.map(id => `ids=${id}&`).join('')
            return `/rest/product?${idsQueryParams}&include_fields=${['name,id'].concat(additionalFields).join(',')}`
          }
        }).call(this, ids || [])
      }
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

Meteor.methods({
  [`${collectionName}.insert`] (creationArgs) {
    // Making sure the user is logged in before creating a unit
    if (!Meteor.userId()) {
      throw new Meteor.Error('not-authorized')
    }

    const {
      type, name, role, moreInfo = '', streetAddress = '', city = '', state = '', zipCode = '', country = '', isOccupant
    } = creationArgs

    // Mandatory fields and values validation
    check(name, String)
    if (!possibleRoles.map(r => r.name).includes(role)) {
      throw new Meteor.Error(`Unrecognized role "${role}"`)
    }
    if (!unitTypes.map(t => t.name).includes(type)) {
      throw new Meteor.Error(`Unrecognized unit type "${type}"`)
    }
    if (isOccupant && !possibleRoles.find(r => r.name === role).canBeOccupant) {
      throw new Meteor.Error(`Not allowed to set 'isOccupant=true' for role "${role}"`)
    }

    // The next part can't be simulated on the client
    if (Meteor.isServer) {
      const unitMongoId = randToken.generate(17)
      const owner = Meteor.users.findOne(Meteor.userId())
      let unitBzId
      try {
        const apiResult = HTTP.call('POST', process.env.UNIT_CREATE_LAMBDA_URL, {
          data: [{
            'mefe_unit_id': unitMongoId,
            'mefe_creator_user_id': owner._id,
            'bzfe_creator_user_id': owner.bugzillaCreds.id,
            'classification_id': 2, // The current only classification value used for MEFE units
            'unit_name': name,
            'unit_description_details': moreInfo
          }],
          headers: {
            Authorization: `Bearer ${process.env.API_ACCESS_TOKEN}`
          }
        })
        unitBzId = apiResult.data[0]

        console.log(`BZ Unit ${name} was created successfully`)
      } catch (e) {
        console.error({
          user: Meteor.userId(),
          method: `${collectionName}.insert`,
          args: [creationArgs],
          step: 'UNIT CREATE lambda request',
          error: e
        })
        throw new Meteor.Error('Unit creation API Lambda error', e)
      }

      // Adding the meta data to the collection
      UnitMetaData.insert({
        _id: unitMongoId,
        bzId: unitBzId,
        displayName: name,
        unitType: type,
        ownerIds: [owner._id],
        createdAt: new Date(),
        streetAddress,
        city,
        zipCode,
        state,
        country,
        moreInfo
      })

      // TODO: Once all dependencies of role resolving are moved from invitations to UnitRolesData, remove this
      // Creating matching invitation records
      const invType = REPLACE_DEFAULT
      const invitationObj = {
        invitedBy: owner.bugzillaCreds.id, // The user "self-invites" itself to the new role
        invitee: owner.bugzillaCreds.id,
        type: invType,
        unitId: unitBzId,
        role,
        isOccupant
      }

      const invitationId = PendingInvitations.insert(Object.assign({
        done: true
      }, invitationObj))

      // Linking invitation to user
      Meteor.users.update(owner._id, {
        $push: {
          receivedInvites: {
            unitId: invitationObj.unitId,
            invitedBy: invitationObj.invitedBy,
            timestamp: Date.now(),
            type: invitationObj.type,
            done: true,
            invitationId,
            role,
            isOccupant
          }
        }
      })

      // Adding to the user to a role on BZ using lambda
      try {
        HTTP.call('POST', process.env.INVITE_LAMBDA_URL, {
          data: [Object.assign({_id: invitationId}, invitationObj)],
          headers: {
            Authorization: `Bearer ${process.env.API_ACCESS_TOKEN}`
          }
        })
      } catch (e) {
        console.error({
          user: Meteor.userId(),
          method: `${collectionName}.insert`,
          args: [creationArgs],
          step: 'INVITE lambda request, unit cleanup might be necessary',
          error: e
        })
        throw new Meteor.Error('Invite API Lambda error', e)
      }

      // Populating the roles for the new unit
      possibleRoles.forEach(({ name: roleName }) => {
        const isSelectedRole = roleName === role // Whether this is the owner/creator's role

        // Contains the owner, empty if not the right role
        const members = isSelectedRole ? [{
          id: owner._id,
          isVisible: true,
          isDefaultInvited: false,
          isOccupant
        }] : []

        // It's the owner or an empty placeholder value
        const defaultAssigneeId = isSelectedRole ? owner._id : -1
        UnitRolesData.insert({
          unitId: unitMongoId,
          roleType: roleName,
          unitBzId,
          defaultAssigneeId,
          members
        })
      })

      return {newUnitId: unitBzId}
    }
  }
})

let Units
if (Meteor.isClient) {
  Units = new Mongo.Collection(collectionName)
}
export default Units
