import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'

import publicationFactory from './base/rest-resource-factory'

const collectionName = 'claims'

// Exported for testing purposes
export const factoryOptions = {
  uriTemplate: (claimId) => `/rest/bug/${claimId}`,
  collectionName,
  dataResolver: (data) => data.bugs[0]
}

if (Meteor.isServer) {
  Meteor.publish('claim', publicationFactory(factoryOptions, false).publishFunc)
}
let Claims
if (Meteor.isClient) {
  Claims = new Mongo.Collection(collectionName)
}

export default Claims
