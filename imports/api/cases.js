import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import bugzillaAPI from '../util/bugzilla-api'

import publicationFactory from './base/rest-resource-factory'

const collectionName = 'cases'

// Exported for testing purposes
export const factoryOptions = {
  uriTemplate: (caseId) => `/rest/bug/${caseId}`,
  collectionName,
  dataResolver: (data) => data.bugs[0]
}

if (Meteor.isServer) {
  Meteor.publish('case', publicationFactory(factoryOptions, false).publishFunc)
  Meteor.publish('my-cases', function () {
    if (!this.userId) {
      this.ready()
      this.error(new Meteor.Error({message: 'Authentication required'}))
      return
    }
    const { callAPI } = bugzillaAPI
    const currUser = Meteor.users.findOne({_id: this.userId})

    const sameUserMatch = '%user%'
    const customQueryPayload = {
      f1: 'assigned_to',
      o1: 'equals',
      v1: sameUserMatch,
      f2: 'cc',
      o2: 'substring',
      v2: sameUserMatch,
      f3: 'reporter',
      o3: 'equals',
      v3: sameUserMatch,
      j_top: 'OR',
      list_id: '78',
      query_format: 'advanced',
      token: currUser.bugzillaCreds.token
    }
    callAPI('get', '/rest/bug', customQueryPayload)
      .then(data => {
        data.bugs.forEach(bug => this.added(collectionName, bug.id.toString(), bug))
        this.ready()
      })
      .catch(err => {
        this.ready()
        this.error(new Meteor.Error({message: 'REST API error', origError: err}))
      })
  })
}
let Cases
if (Meteor.isClient) {
  Cases = new Mongo.Collection(collectionName)
}

export default Cases
