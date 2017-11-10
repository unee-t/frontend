import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import publicationFactory from './base/rest-resource-factory'

const collectionName = 'comments'

// Exported for testing purposes
export const factoryOptions = {
  uriTemplate: (claimId) => `/rest/bug/${claimId}/comment`,
  collectionName,
  dataResolver: (data, claimId) => data.bugs[claimId.toString()].comments
}

if (Meteor.isServer) {
  Meteor.publish('claimComments', publicationFactory(factoryOptions, true))
}
let Comments
if (Meteor.isClient) {
  Comments = new Mongo.Collection(collectionName)
}

export default Comments
