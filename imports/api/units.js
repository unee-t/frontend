import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { HTTP } from 'meteor/http'
import { check } from 'meteor/check'
import randToken from 'rand-token'
import _ from 'lodash'
import publicationFactory from './base/rest-resource-factory'
import { makeAssociationFactory, withUsers, withDocs } from './base/associations-helper'
import UnitMetaData, { unitTypes, collectionName as unitMetaCollName } from './unit-meta-data'
import UnitRolesData, { possibleRoles, collectionName as unitRolesCollName } from './unit-roles-data'
import PendingInvitations, { REPLACE_DEFAULT } from './pending-invitations'
import { callAPI } from '../util/bugzilla-api'
import { logger } from '../util/logger'

export const collectionName = 'units'

// TODO: TEST THIS STUFF!!! (but later)
export const factoryOptions = {
  collectionName,
  dataResolver: data => data.products,
  idResolver: item => item.name // Using a custom idResolver to allow for an efficient matching of unit to case via _id querying
}

export let serverHelpers

if (Meteor.isServer) {
  serverHelpers = {
    getAPIUnitByName (unitName, apiKey) {
      try {
        const requestUrl = `/rest/product?names=${encodeURIComponent(unitName)}`
        const unitResult = callAPI('get', requestUrl, { api_key: apiKey }, false, true)
        return unitResult.data.products[0]
      } catch (e) {
        // Pass through just to highlight this method can throw
        throw e
      }
    }
  }
}

const makeInvitationMatcher = unitItem => ({
  receivedInvites: {
    $elemMatch: {
      unitId: unitItem.id
    }
  }
})

const unitAssocHelper = (coll, collName, idFieldName) => fields => withDocs({
  cursorMaker: publishedItem =>
    coll.find({
      [idFieldName]: publishedItem.id
    }, {
      fields
    }),
  collectionName: collName
})

const withMetaData = unitAssocHelper(UnitMetaData, unitMetaCollName, 'bzId')
const withRolesData = unitAssocHelper(UnitRolesData, unitRolesCollName, 'unitBzId')

export const getUnitRoles = unit => {
  // Resolving roles via the newer mongo collection
  const roleDocs = UnitRolesData.find({ unitBzId: unit.id }).fetch()

  // Prefetching all user docs to optimize query performance (single query vs one for each user)
  const userIds = roleDocs.reduce((all, roleObj) => all.concat(roleObj.members.map(mem => mem.id)), [])
  const userDocs = Meteor.users.find({ _id: { $in: userIds } }).fetch()

  // Constructing the user role objects array similar to the way it is done from BZ's product components below
  const roleUsers = roleDocs.reduce((all, roleObj) => {
    roleObj.members.forEach(memberDesc => {
      // Using the prefetched array to find the user doc
      const user = userDocs.find(doc => doc._id === memberDesc.id)
      all.push({
        userId: user._id,
        login: user.bugzillaCreds.login,
        email: user.emails[0].address,
        name: user.profile.name,
        role: roleObj.roleType,
        isOccupant: memberDesc.isOccupant,
        avatarUrl: user.profile.avatarUrl
      })
    })
    return all
  }, [])

  if (roleUsers.length) {
    return roleUsers
  }

  // Legacy method used as fallback
  const invMatcher = makeInvitationMatcher(unit)
  invMatcher.receivedInvites.$elemMatch.done = true
  return _.uniqBy(
    unit.components.reduce((all, { default_assigned_to: assigned, name }) => { // Getting names from the unit's components
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
    ({ login }) => login // Filtering out duplicates in case a user shows up in a component and has a finalized invitation
  )
}

export const addUserToRole = (invitingUser, inviteeUser, unitBzId, role, invType, isOccupant, errorLogParams = {}) => {
  // Creating matching invitation records
  const invitationObj = {
    invitedBy: invitingUser.bugzillaCreds.id,
    invitee: inviteeUser.bugzillaCreds.id,
    type: invType,
    unitId: unitBzId,
    role,
    isOccupant
  }

  // TODO: Once all dependencies of role resolving are moved from invitations to UnitRolesData, remove this
  // Creating the invitation as pending first
  const invitationId = PendingInvitations.insert(invitationObj)

  // Linking invitation to user
  Meteor.users.update(inviteeUser._id, {
    $push: {
      receivedInvites: {
        unitId: invitationObj.unitId,
        invitedBy: invitingUser._id,
        timestamp: Date.now(),
        type: invitationObj.type,
        invitationId,
        role,
        isOccupant
      }
    }
  })

  // Adding to the user to a role on BZ using lambda
  try {
    HTTP.call('POST', process.env.INVITE_LAMBDA_URL, {
      data: [Object.assign({ _id: invitationId }, invitationObj)],
      headers: {
        Authorization: `Bearer ${process.env.API_ACCESS_TOKEN}`
      }
    })
  } catch (e) {
    logger.error({
      ...errorLogParams,
      step: 'INVITE lambda request, unit cleanup might be necessary',
      error: e
    })
    throw new Meteor.Error('Invite API Lambda error', e)
  }

  // Marking the pending invitation as "done", now that the API responded with success
  PendingInvitations.update({ _id: invitationId }, {
    $set: {
      done: true
    }
  })
  Meteor.users.update({
    _id: inviteeUser._id,
    'receivedInvites.invitationId': invitationId
  }, {
    $set: {
      'receivedInvites.$.done': true
    }
  })

  // Updating the roles collection to sync with BZ's state
  const unitRoleQuery = {
    roleType: role,
    unitBzId
  }
  UnitRolesData.update(unitRoleQuery, {
    $push: {
      members: {
        id: inviteeUser._id,
        isVisible: true,
        isDefaultInvited: false,
        isOccupant
      }
    }
  })

  // Matching the role if the defaultAssigneeId is not defined and sets it to the current user. Does nothing otherwise
  let doForceAssigneeUpdate
  switch (invType) {
    case REPLACE_DEFAULT:
      doForceAssigneeUpdate = true
      break
    default:
      doForceAssigneeUpdate = false
  }
  const assigneeUpdateQuery = doForceAssigneeUpdate ? unitRoleQuery : {
    defaultAssigneeId: -1,
    ...unitRoleQuery
  }
  UnitRolesData.update(assigneeUpdateQuery, {
    $set: {
      defaultAssigneeId: inviteeUser._id
    }
  })
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
          const listResponse = callAPI('get', apiUrl, { api_key: apiKey }, false, true)
          ids = listResponse.data.ids
          if (!ids) throw new Meteor.Error({ message: 'Malformed API response', response: listResponse })
        } catch (e) {
          logger.error('API error encountered', `${collectionName}.${funcName}`, this.userId)
          this.ready()
          this.error(new Meteor.Error({ message: 'REST API error', origError: e }))
        }
      }
      if (ids.length === 0) {
        this.ready()
      } else {
        associationFactory(
          factory.publishById({ // It would work exactly the same for the name according to the BZ API docs
            uriTemplate: ids => {
              const idsQueryParams = ids.map(id => `ids=${id}&`).join('')
              return `/rest/product?${idsQueryParams}&include_fields=${['name,id,is_active'].concat(additionalFields).join(',')}`
            }
          }),
          withMetaData({
            bzId: 1,
            displayName: 1,
            moreInfo: 1,
            unitType: 1,
            ownerIds: {
              $elemMatch: {
                $in: [this.userId]
              }
            },
            disabled: 1
          })
        ).call(this, ids || [])
      }
    })
  const makeUnitPublisherWithAssocs = ({ funcName, uriBuilder, assocFuncs }) => {
    Meteor.publish(`${collectionName}.${funcName}`, associationFactory(
      factory.publishById({ // It would work exactly the same for the name according to the BZ API docs
        uriTemplate: uriBuilder
      }),
      ...assocFuncs
    ))
  }

  const makeUnitWithUsersPublisher = ({ funcName, uriBuilder, metaDataFields }) => {
    makeUnitPublisherWithAssocs({
      assocFuncs: [
        withUsers(
          unitItem => getUnitRoles(unitItem).map(u => u.login),
          // Should rely both on completed invitations and unit information (which is why the "$or" is there)
          (query, unitItem) => ({ $or: [makeInvitationMatcher(unitItem), query] }),
          (projection, unitItem) => Object.assign(makeInvitationMatcher(unitItem), projection)
        ),
        withMetaData(metaDataFields || {
          ownerIds: 0
        }),
        withRolesData({
          unitBzId: 1,
          roleType: 1,
          members: 1
        })
      ],
      funcName,
      uriBuilder
    })
  }
  const nameUriBuilderBuilder = (extParams = {}) => unitName => ({
    url: '/rest/product',
    params: {
      names: unitName,
      ...extParams
    }
  })
  const idUriBuilderBuilder = (extParams = {}) => unitId => ({
    url: '/rest/product',
    params: {
      ids: unitId,
      ...extParams
    }
  })
  makeUnitWithUsersPublisher({
    funcName: 'byNameWithUsers',
    uriBuilder: nameUriBuilderBuilder()
  })
  makeUnitWithUsersPublisher({
    funcName: 'byIdWithUsers',
    uriBuilder: idUriBuilderBuilder()
  })

  const unitRolesAssocFuncs = [
    withMetaData({
      bzId: 1,
      displayName: 1,
      unitType: 1
    }),
    withRolesData({})
  ]
  const rolesFieldsParams = {
    include_fields: 'name,id,components' // 'components' is only added as a fallback in case the roles are missing
  }
  makeUnitPublisherWithAssocs({
    funcName: 'byIdWithRoles',
    uriBuilder: idUriBuilderBuilder(rolesFieldsParams),
    assocFuncs: unitRolesAssocFuncs
  })
  makeUnitPublisherWithAssocs({
    funcName: 'byNameWithRoles',
    uriBuilder: nameUriBuilderBuilder(rolesFieldsParams),
    assocFuncs: unitRolesAssocFuncs
  })

  // TODO: remove this if it doesn't get reused by other UI components
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
      let unitBzId, unitBzName

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
        unitBzId = apiResult.data[0].id
        unitBzName = apiResult.data[0].name
        logger.info(`BZ Unit ${name} was created successfully`)
      } catch (e) {
        logger.error({
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
        bzName: unitBzName,
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

      // Populating the roles for the new unit
      possibleRoles.forEach(({ name: roleName }) => {
        UnitRolesData.insert({
          unitId: unitMongoId,
          roleType: roleName,
          defaultAssigneeId: -1,
          members: [],
          unitBzId
        })
      })

      addUserToRole(owner, owner, unitBzId, role, REPLACE_DEFAULT, isOccupant, {
        user: Meteor.userId(),
        method: `${collectionName}.insert`,
        args: [creationArgs]
      })

      return { newUnitId: unitBzId }
    }
  }
})

let Units
if (Meteor.isClient) {
  Units = new Mongo.Collection(collectionName)
  Units.helpers({
    metaData () {
      return UnitMetaData.findOne({ bzId: this.id })
    },
    rolesData () {
      return UnitRolesData.find({ unitBzId: this.id }).fetch()
    }
  })
}
export default Units
