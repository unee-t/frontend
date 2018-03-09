import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check } from 'meteor/check'
import bugzillaApi from '../util/bugzilla-api'
import _ from 'lodash'

import publicationFactory from './base/rest-resource-factory'
import { makeAssociationFactory, withUsers } from './base/associations-helper'
import { emailValidator } from '../util/validators'
import PendingInvitations, { unassignPending, TYPE_ASSIGNED } from './pending-invitations'

export const collectionName = 'cases'
export const caseFieldMapping = {
  category: 'rep_platform',
  subCategory: 'cf_ipi_clust_6_claim_type',
  priority: 'priority',
  severity: 'bug_severity',
  selectedUnit: 'product',
  assignedUnitRole: 'component',
  title: 'summary',
  details: 'description'
}

export const getCaseUsers = (() => {
  const normalizeUser = ({real_name: realName, email, name}) => ({
    login: name,
    name: realName,
    email
  })
  return caseItem => ({
    creator: normalizeUser(caseItem.creator_detail),
    assigned: normalizeUser(caseItem.assigned_to_detail),
    subscribed: caseItem.cc_detail.map(normalizeUser)
  })
})()

const denormalizeUser = ({login, name, email}) => ({
  name: login,
  real_name: name,
  email
})

// Exported for testing purposes
export const factoryOptions = {
  collectionName,
  dataResolver: data => data.bugs
}

const MAX_RESULTS = 50

let publicationObj
if (Meteor.isServer) {
  publicationObj = publicationFactory(factoryOptions)
  const associationFactory = makeAssociationFactory(collectionName)

  Meteor.publish(`${collectionName}.byId`, associationFactory(
    publicationObj.publishById({
      uriTemplate: caseId => `/rest/bug/${caseId}`
    }),
    withUsers(caseItem => _.flatten(Object.values(getCaseUsers(caseItem))).map(u => u.login))
  ))
  // TODO: Add tests for this
  Meteor.publish(`${collectionName}.associatedWithMe`, publicationObj.publishByCustomQuery({
    uriTemplate: () => '/rest/bug',
    queryBuilder: subHandle => {
      if (!subHandle.userId) {
        return {}
      }
      const currUser = Meteor.users.findOne(subHandle.userId)
      const { login: userIdentifier } = currUser.bugzillaCreds
      return {
        f1: 'assigned_to',
        o1: 'equals',
        v1: userIdentifier,
        f2: 'cc',
        o2: 'substring',
        v2: userIdentifier,
        f3: 'reporter',
        o3: 'equals',
        v3: userIdentifier,
        j_top: 'OR',
        list_id: '78',
        resolution: '---',
        query_format: 'advanced',
        limit: MAX_RESULTS
      }
    },
    addedMatcherFactory: strQuery => {
      const { v1: userIdentifier } = JSON.parse(strQuery)
      return caseItem => {
        const { assigned_to: assignedTo, creator, cc } = caseItem
        return (
          userIdentifier === assignedTo ||
          userIdentifier === creator ||
          cc.includes(userIdentifier)
        )
      }
    }
  }))
}

Meteor.methods({
  [`${collectionName}.toggleParticipant`] (email, caseId, isAdd = true) {
    check(email, String)
    check(caseId, Number)

    if (!emailValidator(email)) {
      throw new Meteor.Error('Email is not valid')
    }

    // Making sure the user is logged in before inserting a comment
    if (!Meteor.userId()) {
      throw new Meteor.Error('not-authorized')
    }

    const { callAPI } = bugzillaApi
    const currUser = Meteor.users.findOne({_id: Meteor.userId()})

    if (Meteor.isClient) {
      const opType = isAdd ? '$push' : '$pull'
      Cases.update({id: caseId}, {
        [opType]: {
          cc: email
        },
        [opType]: {
          cc_detail: {name: email}
        }
      })
    } else {
      const { token } = currUser.bugzillaCreds
      const opType = isAdd ? 'add' : 'remove'
      const payload = {
        token,
        cc: {
          [opType]: [email]
        }
      }

      try {
        callAPI('put', `/rest/bug/${caseId}`, payload, false, true)

        const caseData = callAPI('get', `/rest/bug/${caseId}`, {token}, false, true)
        const { cc, cc_detail } = caseData.data.bugs[0]
        console.log(`${email} was ${isAdd ? '' : 'un'}subscribed to case ${caseId}`)
        publicationObj.handleChanged(caseId, {cc, cc_detail})
      } catch (e) {
        console.error({
          user: Meteor.userId(),
          method: `${collectionName}.toggleParticipant`,
          args: [email, caseId, isAdd],
          error: e
        })
        throw new Meteor.Error('API error')
      }
    }
  },
  [`${collectionName}.insert`] (params) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('not-authorized')
    }
    if (Meteor.isServer) {
      const { bugzillaCreds: { token } } = Meteor.users.findOne(Meteor.userId())
      const { callAPI } = bugzillaApi
      const normalizedParams = Object.keys(params).reduce((all, paramName) => {
        all[caseFieldMapping[paramName]] = params[paramName]
        return all
      }, {})

      // Hardcoded values to avoid issues with BZ API "required" checks
      normalizedParams.version = '---'
      normalizedParams.op_sys = 'Unspecified' // NOTE: This might an actual value at a later evolution step of the app
      normalizedParams[caseFieldMapping.category] = normalizedParams[caseFieldMapping.category] || '---'
      normalizedParams[caseFieldMapping.subCategory] = normalizedParams[caseFieldMapping.subCategory] || '---'

      normalizedParams.token = token
      try {
        const { data: { id: newCaseId } } = callAPI('post', '/rest/bug', normalizedParams, false, true)
        console.log(`a new case has been created by user ${Meteor.userId()}, case id: ${newCaseId}`)
        // TODO: Add real time update handler usage
        return {newCaseId}
      } catch (e) {
        // TODO: adopt this error format for other API errors too
        console.error({
          user: Meteor.userId(),
          method: `${collectionName}.insert`,
          args: [params],
          error: e
        })
        throw new Meteor.Error(`API Error: ${e.response.data.message}`)
      }
    }
  },
  [`${collectionName}.changeAssignee`] (user, caseId) {
    check(user, Object)
    check(user.login, String)
    check(caseId, Number)

    if (!Meteor.userId()) {
      throw new Meteor.Error('not-authorized')
    }

    const assigneeUser = Meteor.users.findOne({'bugzillaCreds.login': user.login})

    unassignPending(caseId)

    let isPending, invitationMatcher
    if (assigneeUser) {
      invitationMatcher = {
        caseId,
        invitee: assigneeUser.bugzillaCreds.id,
        done: { $ne: true }
      }
      isPending = !!PendingInvitations.findOne(invitationMatcher)
    }

    if (isPending) {
      Meteor.users.update({
        'bugzillaCreds.login': user.login,
        'invitedToCases.caseId': caseId
      }, {
        $set: {
          'invitedToCases.$.type': TYPE_ASSIGNED
        }
      })
      PendingInvitations.update(invitationMatcher, {
        $set: {
          type: TYPE_ASSIGNED
        }
      })
    } else {
      if (Meteor.isClient) {
        Cases.update({id: caseId}, {
          $set: {
            assigned_to_detail: denormalizeUser(user),
            assigned_to: user.login
          }
        })
      } else { // is server
        const { callAPI } = bugzillaApi
        const { bugzillaCreds: { token } } = Meteor.users.findOne({_id: Meteor.userId()})
        try {
          callAPI('put', `/rest/bug/${caseId}`, {assigned_to: user.login, token}, false, true)

          const caseData = callAPI('get', `/rest/bug/${caseId}`, {token}, false, true)
          const { assigned_to, assigned_to_detail } = caseData.data.bugs[0]
          console.log(`${user.login} was assigned to case ${caseId}`)
          publicationObj.handleChanged(caseId, {assigned_to, assigned_to_detail})
        } catch (e) {
          console.error({
            user: Meteor.userId(),
            method: `${collectionName}.changeAssignee`,
            args: [user, caseId],
            error: e
          })
          throw new Meteor.Error('API error')
        }
      }
    }
  },
  [`${collectionName}.editCaseField`] (caseId, fieldName, newValue) {
    check(caseId, Number)
    check(newValue, String)
    const editableFields = [
      'summary',
      'cf_ipi_clust_1_solution',
      'cf_ipi_clust_1_next_step'
    ]
    if (!editableFields.includes(fieldName)) {
      throw new Meteor.Error('illegal fieldName')
    }
    if (!Meteor.userId()) {
      throw new Meteor.Error('not-authorized')
    }

    if (Meteor.isClient) {
      Cases.update({id: caseId}, {
        $set: {
          [fieldName]: newValue
        }
      })
    } else { // is server
      const { callAPI } = bugzillaApi
      const { bugzillaCreds: { token } } = Meteor.users.findOne({_id: Meteor.userId()})
      try {
        callAPI('put', `/rest/bug/${caseId}`, {[fieldName]: newValue, token}, false, true)
        const caseData = callAPI('get', `/rest/bug/${caseId}`, {token}, false, true)
        const updatedVal = caseData.data.bugs[0][fieldName]
        publicationObj.handleChanged(caseId, {[fieldName]: updatedVal})
      } catch (e) {
        console.error({
          user: Meteor.userId(),
          method: `${collectionName}.editCaseField`,
          args: [caseId, fieldName, newValue],
          error: e
        })
        throw new Meteor.Error('API error')
      }
    }
  }
})

let Cases
if (Meteor.isClient) {
  Cases = new Mongo.Collection(collectionName)
}

export default Cases
