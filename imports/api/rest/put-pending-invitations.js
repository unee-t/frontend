import { PendingInvitations } from '../pending-invitations'
import { invite } from '../../util/email-invite'
import { Meteor } from 'meteor/meteor'

export default (req, res) => {
  if (req.query.accessToken !== process.env.API_ACCESS_TOKEN) {
    res.send(401)
    return
  }

  console.log('Marking done:', req.body)
  try {
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
      console.log(`Inviting`, invitee, 'by', inviteby)
      invite(invitee, inviteby)
    })
    res.send(200, results)
  } catch (e) {
    res.send(500, e)
  }
}
