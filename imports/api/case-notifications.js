import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { Mongo } from 'meteor/mongo'

export const collectionName = 'caseNotifications'

const CaseNotifications = new Mongo.Collection(collectionName)

Meteor.methods({
  [`${collectionName}.markAsRead`] (caseId) {
    check(caseId, Number)
    const userId = Meteor.userId()
    if (!userId) {
      throw new Meteor.Error('Must be logged in first')
    }

    CaseNotifications.update({
      markedAsRead: { $ne: true },
      caseId,
      userId
    }, {
      $set: {
        markedAsRead: true
      }
    }, {
      multi: true
    })
  }
})

if (Meteor.isServer) {
  Meteor.publish(`${collectionName}.myUpdates`, function () {
    if (!this.userId) {
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
