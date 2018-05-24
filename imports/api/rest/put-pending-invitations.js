import PendingInvitations from '../pending-invitations'
import { invite } from '../../util/email-invite'
import { Meteor } from 'meteor/meteor'
import { reloadCaseFields } from '../cases'

export default (req, res) => {
  if (req.query.accessToken !== process.env.API_ACCESS_TOKEN) {
    res.send(401)
    return
  }

  console.log('Marking done:', req.body)
  try {
    // How to rollback: db.pendingInvitations.update({},{ $unset: {done:1}})
    const results = PendingInvitations.update({
      _id: { $in: req.body },
      done: { $ne: true }
    },
      { $set: { done: true } })
    if (results < 1) {
      // Nothing happened, so don't send any emails
      res.send(200, results)
      return
    }
    req.body.forEach((id) => {
      const inviteInfo = PendingInvitations.findOne({ _id: id })
      const inviteby = Meteor.users.findOne({ 'bugzillaCreds.id': inviteInfo.invitedBy })
      const invitee = Meteor.users.findOne({ 'bugzillaCreds.id': inviteInfo.invitee }, {
        fields: {
          emails: 1,
          invitedToCases: {
            $elemMatch: {
              caseId: inviteInfo.caseId
            }
          }
        }
      })
      try {
        invite(invitee, inviteby)
      } catch (e) {
        console.log(`Sending invitation email to ${invitee.emails[0].address} has failed due to`, e)
      }
      console.log(inviteby.emails[0].address, 'has invited', invitee.emails[0].address)

      // Also store back reference to who invited that user?

      // Update invitee user that he/she has been invited to a particular case
      Meteor.users.update(
        {
          'bugzillaCreds.id': inviteInfo.invitee,
          'invitedToCases': { $elemMatch: { caseId: inviteInfo.caseId } }
        },
        {
          $set: {
            'invitedToCases.$.done': true
          }
        }
      )

      // Since calling this implies that a new user has been added to the case, the case needs to be reloaded
      try {
        reloadCaseFields(inviteInfo.caseId, ['involvedList', 'involvedListDetail'])
      } catch (e) {
        console.error({
          apiCall: `PUT /pendingInvitations/done`,
          reqBody: req.body,
          error: e
        })
      }
    })
    res.send(200, results)
  } catch (e) {
    res.send(500, e)
  }
}
