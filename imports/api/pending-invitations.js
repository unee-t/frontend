import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check } from 'meteor/check'
import { Accounts } from 'meteor/accounts-base'
import randToken from 'rand-token'
import { callAPI } from '../util/bugzilla-api'
import { HTTP } from 'meteor/http'
import { findOrCreateUser } from './custom-users'

export const collectionName = 'pendingInvitations'

export const TYPE_ASSIGNED = 'type_assigned'
export const TYPE_CC = 'type_cc'
export const REPLACE_DEFAULT = 'replace_default'
export const KEEP_DEFAULT = 'keep_default'

const allowedTypes = [TYPE_ASSIGNED, TYPE_CC]

const PendingInvitations = new Mongo.Collection(collectionName)

export const unassignPending = caseId => {
  Meteor.users.update({
    receivedInvites: {
      $elemMatch: {
        caseId,
        type: TYPE_ASSIGNED,
        done: {$ne: true}
      }
    }
  }, {
    $set: {
      'receivedInvites.$.type': TYPE_CC
    }
  })
  PendingInvitations.update({
    caseId,
    type: TYPE_ASSIGNED,
    done: {$ne: true}
  }, {
    $set: {
      type: TYPE_CC
    }
  })
}

export const findUnitRoleConflictErrors = (unitId, email, role, isOccupant) => {
  const currUser = Meteor.users.findOne({_id: Meteor.userId()})
  const { apiKey } = currUser.bugzillaCreds

  let unitItem
  try {
    const unitRequest = callAPI('get', `/rest/product/${unitId}`, {api_key: apiKey}, false, true)
    unitItem = unitRequest.data.products[0]
  } catch (e) {
    console.error(e)
    return 'API Error'
  }

  // Checking only the default_assigned_to field (Should default_qa_contact be added too in the future?)
  const userAssignedToComponent = unitItem.components.filter(
    ({default_assigned_to: assignedTo}) => assignedTo === email
  ).length > 0
  const userWasInvitedToRole = (() => {
    const existingInvolvedUser = Meteor.users.findOne({
      'emails.address': email,
      receivedInvites: {
        $elemMatch: {
          unitId,
          // This is only for if the invitation was already 'done' so the user can be added to the case directly,
          //   and not via email
          done: true
        }
      }
    })
    return !!existingInvolvedUser
  })()
  const isUserAlreadyInvolved = userAssignedToComponent || userWasInvitedToRole
  if (isUserAlreadyInvolved) {
    return 'This email belongs to a user already assigned to a role in this unit'
  }

  const inviteeUser = Accounts.findUserByEmail(email)
  if (inviteeUser && inviteeUser.receivedInvites) {
    const conflictingUnitInvitations = inviteeUser.receivedInvites.filter(
      ({role: roleB, isOccupant: isOccupantB, unitId: unitIdB}) => (
        unitIdB === unitId && (isOccupantB !== isOccupant || roleB !== role)
      )
    )
    if (conflictingUnitInvitations.length) {
      return 'This user was already invited to another case for this unit, but in a different role'
    }
  }
  return false
}

export const createPendingInvitation = (email, role, isOccupant, caseId, unitId, type) => {
  const currUser = Meteor.users.findOne({_id: Meteor.userId()})
  const inviteeUser = findOrCreateUser(email)

  // Checking if there's another user invited to be the assignee, changing it to be CC instead
  if (type === TYPE_ASSIGNED) {
    unassignPending(caseId)
  }

  const invitationId = PendingInvitations.insert({
    invitedBy: currUser.bugzillaCreds.id,
    invitee: inviteeUser.bugzillaCreds.id,
    role,
    isOccupant,
    caseId,
    unitId,
    type
  })

  console.log('PendingInvitation created', PendingInvitations.findOne(invitationId))

  // Updating the invitee user with the details of the invitation
  Meteor.users.update(inviteeUser._id, {
    $push: {
      receivedInvites: {
        invitationId,
        role,
        isOccupant,
        caseId,
        unitId,
        invitedBy: currUser._id,
        timestamp: Date.now(),
        type,
        accessToken: randToken.generate(24)
      }
    }
  })

  console.log('Invitee updated', inviteeUser._id, Meteor.users.findOne(inviteeUser._id).receivedInvites)

  try {
    HTTP.get(process.env.INVITE_LAMBDA_URL, {
      headers: {
        Authorization: `Bearer ${process.env.API_ACCESS_TOKEN}`
      }
    })
  } catch (e) {
    console.error({
      message: 'Invite lambda error in "pull" mode',
      error: e
    })
  }
}

PendingInvitations.helpers({
  inviteeUser () {
    return Meteor.users.findOne({'bugzillaCreds.id': this.invitee})
  }
})

if (Meteor.isServer) {
  Meteor.publish(`${collectionName}.byCaseId`, function (caseId) {
    check(caseId, Number)

    if (!this.userId) {
      this.ready()
      this.error('Unauthorized')
      return
    }

    return [
      PendingInvitations.find({
        caseId,
        done: {$ne: true}
      }),
      Meteor.users.find({
        receivedInvites: {
          $elemMatch: {
            caseId,
            done: {$ne: true}
          }
        }
      }, {
        fields: {
          'emails.address': 1,
          'bugzillaCreds.id': 1,
          'bugzillaCreds.login': 1,
          profile: 1
        }
      })
    ]
  })
}

Meteor.methods({
  [`${collectionName}.inviteNewUser`] (email, role, isOccupant, caseId, unitId, type) {
    // Making sure the user is logged in before inserting a comment
    if (!Meteor.userId()) throw new Meteor.Error('not-authorized')
    if (!allowedTypes.includes(type)) {
      throw new Meteor.Error('Invalid invitation type')
    }
    if (Meteor.isServer) {
      const conflictMessage = findUnitRoleConflictErrors(unitId, email, role, isOccupant)
      if (conflictMessage) {
        throw new Meteor.Error(conflictMessage)
      }

      const inviteeUser = Accounts.findUserByEmail(email)
      if (inviteeUser && inviteeUser.receivedInvites) {
        const conflictingCaseInvitations = inviteeUser.receivedInvites.filter(({caseId: caseIdB}) => caseIdB === caseId)
        if (conflictingCaseInvitations.length) {
          throw new Meteor.Error(
            'This user has been invited before to this case, please wait until the invitation is finalized'
          )
        }
      }
      createPendingInvitation(email, role, isOccupant, caseId, unitId, type)
    }
  }
})

export default PendingInvitations
