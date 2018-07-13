import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'

export const collectionName = 'caseNotifications'

const CaseNotifications = new Mongo.Collection(collectionName)

if (Meteor.isServer) {
  Meteor.publish(`${collectionName}.myUpdates`, function () {
    if (!this.userId) {
      this.ready()
      this.error(new Meteor.Error('Must be logged in first'))
    }
    return CaseNotifications.find({
      userId: this.userId
    }, {
      caseId: 1,
      unitBzId: 1,
      type: 1,
      createdAt: 1,
      markedAsRead: 1
    })
  })
}

export default CaseNotifications
