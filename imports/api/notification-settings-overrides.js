import { Mongo } from 'meteor/mongo'

export const collectionName = 'notificationSettingsOverrides'

/* Contains docs of format:
  {
    userBzId: int,
    caseId/unitBzId: int,
    settings: Notification settings complete/partial definition (see custom-users.js for the complete definition)
  }
*/
export default new Mongo.Collection(collectionName)
