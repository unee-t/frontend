import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'

import publicationFactory from './base/rest-resource-factory'

const collectionName = 'cases'

// Exported for testing purposes
export const factoryOptions = {
  collectionName,
  dataResolver: data => data.bugs
}

const MAX_RESULTS = 20

if (Meteor.isServer) {
  const factory = publicationFactory(factoryOptions)
  Meteor.publish('case', factory.publishById({
    uriTemplate: caseId => `/rest/bug/${caseId}`
  }))
  // TODO: Add tests for this
  Meteor.publish('myCases', factory.publishByCustomQuery({
    uriTemplate: () => '/rest/bug',
    queryBuilder: subHandle => {
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
let Cases
if (Meteor.isClient) {
  Cases = new Mongo.Collection(collectionName)
}

export default Cases
