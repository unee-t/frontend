import { Mongo } from 'meteor/mongo'

export const collectionName = 'accessInvitations'

const accessInvitations = new Mongo.Collection(collectionName)

export default accessInvitations
