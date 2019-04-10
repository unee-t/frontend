import { Mongo } from 'meteor/mongo'

export const collectionName = 'failedUnitCreations'

const FailedUnitCreations = new Mongo.Collection(collectionName)

export default FailedUnitCreations
