import { Mongo } from 'meteor/mongo'

export const collectionName = 'promoCodes'

/* Contains docs of format:
  {
    code: string
    createdAt: Date
    expiresOn?: Date
  }
*/
export default new Mongo.Collection(collectionName)
