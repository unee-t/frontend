import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check } from 'meteor/check'
import bugzillaApi from '../util/bugzilla-api'

import publicationFactory from './base/rest-resource-factory'
import { emailValidator } from '../util/validators'

const collectionName = 'cases'

// Exported for testing purposes
export const factoryOptions = {
  collectionName,
  dataResolver: data => data.bugs
}

const MAX_RESULTS = 20

let publicationObj
if (Meteor.isServer) {
  publicationObj = publicationFactory(factoryOptions)
  Meteor.publish('case', publicationObj.publishById({
    uriTemplate: caseId => `/rest/bug/${caseId}`
  }))
  // TODO: Add tests for this
  Meteor.publish('myCases', publicationObj.publishByCustomQuery({
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
  [`${collectionName}.addParticipant`] (email, caseId) {
    check(email, String)
    check(caseId, Number)

    if (!emailValidator(email)) {
      throw new Meteor.Error('Email is no valid')
    }

    // Making sure the user is logged in before inserting a comment
    if (!Meteor.userId()) {
      throw new Meteor.Error('not-authorized')
    }

    const { callAPI } = bugzillaApi
    const currUser = Meteor.users.findOne({_id: Meteor.userId()})

    if (Meteor.isClient) {
      Cases.update({id: caseId}, {
        $push: {
          cc: email
        }
      })
    } else {
      const { token } = currUser.bugzillaCreds
      const payload = {
        token,
        cc: {
          add: [email]
        }
      }

      try {
        callAPI('put', `/rest/bug/${caseId}`, payload, false, true)

        const caseData = callAPI('get', `/rest/bug/${caseId}`, {token}, false, true)
        const { cc } = caseData.data.bugs[0]
        console.log(`${email} was subscribed to case ${caseId}`)
        publicationObj.handleChanged(caseId, {cc})
      } catch (e) {
        console.error(e)
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
