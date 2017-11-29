import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'

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
}
let Cases
if (Meteor.isClient) {
  Cases = new Mongo.Collection(collectionName)
}

export default Cases
