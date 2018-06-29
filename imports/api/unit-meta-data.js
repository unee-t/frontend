import { Mongo } from 'meteor/mongo'

export const collectionName = 'unitMetaData'
const UnitMetaData = new Mongo.Collection(collectionName)

export default UnitMetaData
