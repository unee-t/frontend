import PendingInvitations from '../pending-invitations'
import { invite } from '../../util/email-invite'
import { Meteor } from 'meteor/meteor'

import { reloadCaseFields } from '../cases'
import UnitRolesData from '../unit-roles-data'
import { logger } from '../../util/logger'

export default (req, res) => {
  if (req.query.accessToken !== process.env.API_ACCESS_TOKEN) {
    res.send(401)
    return
  }

  logger.info('Marking done:', req.body)
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
          receivedInvites: {
            $elemMatch: {
              invitationId: id
            }
          }
        }
      })
      try {
        invite(invitee, inviteby)
      } catch (e) {
        logger.info(`Sending invitation email to ${invitee.emails[0].address} has failed due to`, e)
      }
      logger.info(inviteby.emails[0].address, 'has invited', invitee.emails[0].address)

      // Also store back reference to who invited that user?

      // Update invitee user that he/she has been invited to a particular case
      Meteor.users.update(
        {
          'bugzillaCreds.id': inviteInfo.invitee,
          'receivedInvites': { $elemMatch: { invitationId: id } }
        },
        {
          $set: {
            'receivedInvites.$.done': true
          }
        }
      )

      const unitRoleMatcher = {
        unitBzId: invitee.receivedInvites[0].unitId,
        roleType: invitee.receivedInvites[0].role
      }

      // Updating the unit's relevant role
      UnitRolesData.update(unitRoleMatcher, {
        $push: {
          members: {
            id: invitee._id,
            isVisible: true,
            isDefaultInvited: false,
            isOccupant: invitee.receivedInvites[0].isOccupant
          }
        }
      })

      // Updating the default assignee for the role if none is defined
      UnitRolesData.update(Object.assign({ defaultAssigneeId: -1 }, unitRoleMatcher), {
        $set: {
          defaultAssigneeId: invitee._id
        }
      })

      // Since calling this implies that a new user has been added to the case, the case needs to be reloaded
      try {
        reloadCaseFields(inviteInfo.caseId, ['involvedList', 'involvedListDetail'])
      } catch (e) {
        logger.error({
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
