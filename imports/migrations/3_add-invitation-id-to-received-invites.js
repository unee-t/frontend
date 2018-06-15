import { Meteor } from 'meteor/meteor'
import { Migrations } from 'meteor/percolate:migrations'
import PendingInvitations from '../api/pending-invitations'

Migrations.add({
  version: 3,
  up: () => {
    PendingInvitations.find().forEach(inv => {
      Meteor.users.update({
        'bugzillaCreds.id': inv.invitee,
        receivedInvites: {
          $elemMatch: {
            caseId: inv.caseId
          }
        }
      }, {
        $set: {
          'receivedInvites.$.invitationId': inv._id
        }
      })
    })
  },
  down: () => {
    Meteor.users.find({
      receivedInvites: {
        $exists: true
      }
    }).forEach(user => {
      user.receivedInvites.forEach(rinv => delete rinv.invitationId)
      Meteor.users.rawCollection().save(user)
    })
  }
})
