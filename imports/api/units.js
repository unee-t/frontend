import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { HTTP } from 'meteor/http'
import { check } from 'meteor/check'
import randToken from 'rand-token'
import _ from 'lodash'
import publicationFactory from './base/rest-resource-factory'
import { makeAssociationFactory, withUsers, withDocs } from './base/associations-helper'
import UnitMetaData, { unitTypes, collectionName as unitMetaCollName } from './unit-meta-data'
import UnitRolesData, { possibleRoles, roleEnum, collectionName as unitRolesCollName } from './unit-roles-data'
import PendingInvitations, { REPLACE_DEFAULT, collectionName as pendingInvitationsCollName } from './pending-invitations'
import { callAPI } from '../util/bugzilla-api'
import { logger } from '../util/logger'
import FailedUnitCreations from './failed-unit-creations'
import { getIncrementFor } from './increment-counters'

export const collectionName = 'units'

// TODO: TEST THIS STUFF!!! (but later)
export const factoryOptions = {
  collectionName,
  dataResolver: data => data.products,
  idResolver: item => item.name // Using a custom idResolver to allow for an efficient matching of unit to case via _id querying
}

export let serverHelpers

export const defaultRoleVisibility = {
  [roleEnum.TENANT]: true,
  [roleEnum.OWNER_LANDLORD]: true,
  [roleEnum.CONTRACTOR]: true,
  [roleEnum.MGT_COMPANY]: true,
  [roleEnum.AGENT]: true,
  'Occupant': true
}

const roleSortOrder = [
  roleEnum.TENANT,
  roleEnum.OWNER_LANDLORD,
  roleEnum.AGENT,
  roleEnum.MGT_COMPANY,
  roleEnum.CONTRACTOR
]

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

const unitAssocHelper = (coll, collName, idFieldName) => (fields, selectionSpecifier = {}) => {
  return withDocs({
    cursorMaker: (publishedItem, userId) => {
      return coll.find({
        [idFieldName]: publishedItem.id,
        ...(typeof selectionSpecifier === 'function' ? selectionSpecifier(userId, publishedItem) : selectionSpecifier)
      }, {
        fields: typeof fields === 'function' ? fields(userId, publishedItem) : fields // If 'fields' is a function, call it with userId
      })
    },
    collectionName: collName
  })
}

const withMetaData = unitAssocHelper(UnitMetaData, unitMetaCollName, 'bzId')
const withRolesData = unitAssocHelper(UnitRolesData, unitRolesCollName, 'unitBzId')

export const getUnitRoles = (unit, userId) => {
  // Resolving roles via the newer mongo collection
  let roleDocs = UnitRolesData.find({ unitBzId: unit.id }).fetch().sort((a, b) => {
    const aInd = roleSortOrder.indexOf(a.roleType)
    const bInd = roleSortOrder.indexOf(b.roleType)
    return aInd - bInd
  })

  const unitMeta = UnitMetaData.findOne({ bzId: unit.id })

  // Locate the user's role member definition
  let userRoleMemObj
  const userRole = roleDocs.find(role => {
    userRoleMemObj = role.members.find(({ id }) => id === userId)
    return !!userRoleMemObj
  })

  // Filter out the roleDocs the member is not allowed to see (done mostly for server invocations, as it's already filtered on the client)
  // Also, a user should always see their own role, even if configured otherwise
  roleDocs = roleDocs.filter(roleDoc => userRole.roleType === roleDoc.roleType || userRoleMemObj.roleVisibility[roleDoc.roleType])

  const memberVisCheck = (memberDesc, roleType) => unitMeta.ownerIds.includes(userId) || // Owner sees all
    (roleType === userRole.roleType && roleType !== 'Contractor') || // Can see all members in the same role, aside from contractors
    (memberDesc.isVisible && (!memberDesc.isOccupant || (memberDesc.isOccupant && userRoleMemObj.roleVisibility['Occupant']))) ||
    memberDesc.id === userId

  // Prefetching all user docs to optimize query performance (single query vs one for each user)
  const userIds = roleDocs.reduce((all, roleObj) => all.concat(
    roleObj.members.reduce((mems, mem) => memberVisCheck(mem, roleObj.roleType) ? mems.concat([mem.id]) : mems, [])
  ), [])
  const userDocs = Meteor.users.find({ _id: { $in: userIds } }).fetch()

  // Creating a comparator for alphabetical name sort
  const nameComparator = new Intl.Collator('en').compare

  // Constructing the user role objects array similar to the way it is done from BZ's product components below
  const roleUsers = roleDocs.reduce((all, roleObj) => {
    const users = roleObj.members.reduce((allUsers, memberDesc) => {
      if (memberVisCheck(memberDesc, roleObj.roleType)) {
        // Using the prefetched array to find the user doc
        const user = userDocs.find(doc => doc._id === memberDesc.id)

        // Checking in case the role is visible, but the user is not (on the client)
        if (user) {
          allUsers.push({
            userId: user._id,
            login: user.bugzillaCreds.login,
            email: user.emails[0].address,
            name: user.profile.name,
            role: roleObj.roleType,
            isDefaultAssignee: roleObj.defaultAssigneeId === user._id,
            isOccupant: memberDesc.isOccupant,
            avatarUrl: user.profile.avatarUrl
          })
        }
      }
      return allUsers
    }, [])

    // Sorting members alphabetically
    all = all.concat(users.sort((a, b) => {
      const aName = a.name || (a.login && a.login.split('@')[0])
      const bName = b.name || (b.login && b.login.split('@')[0])
      return nameComparator(aName, bName)
    }))
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
          role: name,
          isDefaultAssignee: true
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
        isOccupant,
        isDefaultAssignee: false
      }))
    ),
    ({ login }) => login // Filtering out duplicates in case a user shows up in a component and has a finalized invitation
  )
}

export const addUserToRole = (
  invitingUser, inviteeUser, unitBzId, role, invType, isOccupant, errorLogParams = {}, doLiveUpdate, isVisible = true,
  isDefaultInvited = true, roleVisibility = defaultRoleVisibility
) => {
  // Filling up role visibility in case some of it is missing
  roleVisibility = Object.assign({}, defaultRoleVisibility, roleVisibility)

  // Creating matching invitation records
  const invitationObj = {
    invitedBy: invitingUser.bugzillaCreds.id,
    invitee: inviteeUser.bugzillaCreds.id,
    mefeInvitationIdIntValue: getIncrementFor(pendingInvitationsCollName),
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
    throw new Meteor.Error('Invite API Lambda error', e, { lambdaStatusCode: e.response.statusCode })
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

  const unitRoleModifier = {
    $push: {
      members: {
        id: inviteeUser._id,
        isVisible,
        isDefaultInvited,
        isOccupant,
        roleVisibility
      }
    }
  }

  UnitRolesData.update(unitRoleQuery, unitRoleModifier)

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

  if (doLiveUpdate) {
    try {
      const response = callAPI('get', `/rest/product?ids=${unitBzId}`, {}, true, true)
      const unitItem = factoryOptions.dataResolver(response.data)[0]
      pubObj.handleChanged(unitItem, ['components'])
    } catch (e) {
      logger.error({
        ...errorLogParams,
        step: 'Fetching unit info for live update after invite, proceeding with no error',
        error: e
      })
    }
  }
}

const rolesProjByOwnership = (userId, unitItem) => {
  return {
    unitBzId: 1,
    roleType: 1,
    members: 1,
    defaultAssigneeId: 1
  }
}

const rolesSelectionByOwnership = (userId, unitItem) => {
  const unitMeta = UnitMetaData.findOne({
    bzId: unitItem.id
  })
  if (unitMeta.ownerIds.includes(userId)) { // An owner can see all roles
    return {}
  } else {
    // Finding this user's role member definition
    const meRole = UnitRolesData.findOne({
      unitBzId: unitItem.id,
      'members.id': userId
    }, {
      fields: {
        'members.$': 1,
        roleType: 1
      }
    })
    const { roleVisibility } = meRole.members[0]

    // Extract an array of all the roles this user is allowed to see
    const types = possibleRoles.reduce((all, roleDef) => {
      if (roleVisibility[roleDef.name]) {
        all.push(roleDef.name)
      }
      return all
    }, [])

    if (!types.includes(meRole.roleType)) {
      types.push(meRole.roleType)
    }

    return {
      roleType: {
        $in: types
      }
    }
  }
}

export let pubObj
if (Meteor.isServer) {
  pubObj = publicationFactory(factoryOptions)
  const associationFactory = makeAssociationFactory(collectionName)

  const makeUnitListPublisher = ({ unitType, funcName, additionalFields }) =>
    Meteor.publish(`${collectionName}.${funcName}`, associationFactory(
      pubObj.publishByCustomQuery({ // It would work exactly the same for the name according to the BZ API docs
        uriTemplate: () => '/rest/product',
        queryBuilder: () => ({
          type: unitType,
          include_fields: ['name,id,is_active'].concat(additionalFields).join(',')
        }),
        requestIdentityResolver: (subHandle, query) => {
          if (!subHandle.userId) return JSON.stringify(query)
          return JSON.stringify({
            unitType,
            user: subHandle.userId
          })
        },
        addedMatcherFactory: identityStr => {
          const idObj = JSON.parse(identityStr)
          const { bugzillaCreds: { login } } = Meteor.users.findOne({ _id: idObj.user })
          return unitItem => {
            const roles = getUnitRoles(unitItem, idObj.user)
            return roles.some(role => role.login === login)
          }
        }
      }),
      withMetaData({
        bzId: 1,
        displayName: 1,
        moreInfo: 1,
        unitType: 1,
        ownerIds: 1,
        disabled: 1
      })
    ))
  const makeUnitPublisherWithAssocs = ({ funcName, uriBuilder, assocFuncs }) => {
    Meteor.publish(`${collectionName}.${funcName}`, associationFactory(
      pubObj.publishById({ // It would work exactly the same for the name according to the BZ API docs
        uriTemplate: uriBuilder
      }),
      ...assocFuncs
    ))
  }

  const makeUnitWithUsersPublisher = ({ funcName, uriBuilder, metaDataFields }) => {
    makeUnitPublisherWithAssocs({
      assocFuncs: [
        withUsers(
          (unitItem, userId) => getUnitRoles(unitItem, userId).map(u => u.login),
          // Should rely both on completed invitations and unit information (which is why the "$or" is there)
          (query, unitItem) => ({ $or: [makeInvitationMatcher(unitItem), query] }),
          (projection, unitItem) => Object.assign(makeInvitationMatcher(unitItem), projection)
        ),
        withMetaData(metaDataFields || {
          bzId: 1,
          displayName: 1,
          moreInfo: 1,
          unitType: 1,
          ownerIds: 1,
          disabled: 1,
          country: 1,
          state: 1,
          streetAddress: 1,
          zipCode: 1,
          city: 1
        }),
        withRolesData(rolesProjByOwnership, rolesSelectionByOwnership)
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
      unitType: 1,
      ownerIds: 1
    }),
    withRolesData(rolesProjByOwnership, rolesSelectionByOwnership)
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
    unitType: 'enterable',
    funcName: 'forReporting',
    additionalFields: 'components'
  })
  makeUnitListPublisher({
    unitType: 'selectable',
    funcName: 'forBrowsing',
    additionalFields: 'description'
  })
}

export function createUnitItem (creatorId, name, type, moreInfo = '', streetAddress = '', city = '', state = '', zipCode = '', country = '', ownerId, errorLogParams) {
  check(moreInfo, String)
  check(streetAddress, String)
  check(city, String)
  check(state, String)
  check(zipCode, String)
  check(country, String)

  // Mandatory fields and values validation
  check(name, String)
  check(type, String)
  check(creatorId, String)

  if (!unitTypes.map(t => t.name).includes(type)) {
    throw new Meteor.Error(`Unrecognized unit type "${type}"`)
  }

  if (Meteor.isServer) {
    const unitMongoId = randToken.generate(17)
    const creator = Meteor.users.findOne(creatorId)
    if (!creator) throw new Meteor.Error(`No Creator user found for id ${ownerId}`)
    ownerId = ownerId || creatorId
    const owner = Meteor.users.findOne(ownerId)
    if (!owner) throw new Meteor.Error(`No Owner user found for id ${ownerId}`)

    const intIdForSql = getIncrementFor(unitMetaCollName)

    let unitBzId, unitBzName
    const lambdaPayload = {
      'mefe_unit_id': unitMongoId,
      'mefe_creator_user_id': owner._id,
      'bzfe_creator_user_id': owner.bugzillaCreds.id,
      'classification_id': 2, // The current only classification value used for MEFE units
      'unit_name': name,
      'unit_description_details': moreInfo,
      'mefeUnitIdIntValue': intIdForSql
    }
    try {
      const apiResult = HTTP.call('POST', process.env.UNIT_CREATE_LAMBDA_URL, {
        data: [lambdaPayload],
        headers: {
          Authorization: `Bearer ${process.env.API_ACCESS_TOKEN}`
        }
      })
      unitBzId = apiResult.data[0].id
      unitBzName = apiResult.data[0].name
      logger.info(`BZ Unit ${name} was created successfully`)
    } catch (e) {
      logger.error({
        ...errorLogParams,
        step: 'UNIT CREATE lambda request',
        error: e
      })
      FailedUnitCreations.insert({
        lambdaPayload,
        error: e.message,
        attemptedAt: new Date(),
        inputData: {
          creatorId,
          name,
          type,
          moreInfo,
          streetAddress,
          city,
          state,
          zipCode,
          country,
          ownerId
        },
        intendedMongoId: unitMongoId
      })
      throw new Meteor.Error('Unit creation API Lambda error', e, { lambdaStatusCode: e.response.statusCode })
    }

    // Adding the meta data to the collection
    UnitMetaData.insert({
      _id: unitMongoId,
      bzId: unitBzId,
      bzName: unitBzName,
      displayName: name,
      unitType: type,
      ownerIds: [owner._id],
      creatorId: creatorId,
      createdAt: new Date(),
      intIdForSql,
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

    const liveUpdateFunc = () => {
      if (Meteor.isServer) {
        try {
          const resp = callAPI('get', `/rest/product?ids=${unitBzId}`, { api_key: process.env.BUGZILLA_ADMIN_KEY }, false, true)
          const unitItem = factoryOptions.dataResolver(resp.data)[0]
          pubObj.handleAdded(unitItem)
        } catch (e) {
          logger.error({
            ...errorLogParams,
            step: 'Fetching unit data for live update, proceeding with no error',
            error: e
          })
        }
      }
    }

    return { unitBzId, owner, liveUpdateFunc, unitMongoId }
  }
}

Meteor.methods({
  [`${collectionName}.insert`] (creationArgs) {
    // Making sure the user is logged in before creating a unit
    if (!Meteor.userId()) {
      throw new Meteor.Error('not-authorized')
    }

    const {
      role, isOccupant, type, name, moreInfo, streetAddress, city, state, zipCode, country
    } = creationArgs
    check(isOccupant, Boolean)

    if (!possibleRoles.map(r => r.name).includes(role)) {
      throw new Meteor.Error(`Unrecognized role "${role}"`)
    }
    if (isOccupant && !possibleRoles.find(r => r.name === role).canBeOccupant) {
      throw new Meteor.Error(`Not allowed to set 'isOccupant=true' for role "${role}"`)
    }
    const userId = Meteor.userId()
    const result = createUnitItem(userId, name, type, moreInfo, streetAddress, city, state, zipCode, country, userId, {
      user: userId,
      method: `${collectionName}.insert`,
      args: [creationArgs]
    })

    // The next part can't be simulated on the client
    if (Meteor.isServer) {
      const { unitBzId, owner, liveUpdateFunc } = result
      addUserToRole(owner, owner, unitBzId, role, REPLACE_DEFAULT, isOccupant, {
        user: userId,
        method: `${collectionName}.insert`,
        args: [creationArgs]
      }, false)

      liveUpdateFunc()

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
