import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { Accounts } from 'meteor/accounts-base'
import randToken from 'rand-token'
import { callAPI } from '../util/bugzilla-api'

export const collectionName = 'pendingInvitations'

export const TYPE_ASSIGNED = 'type_assigned'
export const TYPE_CC = 'type_cc'

const allowedTypes = [TYPE_ASSIGNED, TYPE_CC]

Meteor.methods({
  [`${collectionName}.inviteNewUser`] (email, role, isOccupant, caseId, unitId, type) {
    // Making sure the user is logged in before inserting a comment
    if (!Meteor.userId()) throw new Meteor.Error('not-authorized')
    if (!allowedTypes.includes(type)) {
      throw new Meteor.Error('Invalid invitation type')
    }
    if (Meteor.isServer) {
      const currUser = Meteor.users.findOne({_id: Meteor.userId()})
      const { token } = currUser.bugzillaCreds

      let unitItem
      try {
        const unitRequest = callAPI('get', `/rest/product/${unitId}`, {token}, false, true)
        unitItem = unitRequest.data.products[0]
      } catch (e) {
        console.error(e)
        throw new Meteor.Error('API Error')
      }

      // Checking only the default_assigned_to field (Should default_qa_contact be added too in the future?)
      const isUserAlreadyInvolved = unitItem.components.filter(
        ({default_assigned_to: assignedTo}) => assignedTo === email
      ).length > 0
      if (isUserAlreadyInvolved) {
        throw new Meteor.Error('This email belongs to a user already assigned to a role in this unit')
      }

      let inviteeUser = Accounts.findUserByEmail(email)
      if (inviteeUser) {
        const conflictingCaseInvitations = inviteeUser.invitedToCases.filter(({caseId: caseIdB}) => caseIdB === caseId)
        if (conflictingCaseInvitations.length) {
          throw new Meteor.Error(
            'This user has been invited before to this case, please wait until the invitation is finalized'
          )
        }
        const conflictingUnitInvitations = inviteeUser.invitedToCases.filter(
          ({role: roleB, isOccupant: isOccupantB, unitId: unitIdB}) => (
            unitIdB === unitId && (isOccupantB !== isOccupant || roleB !== role)
          )
        )
        if (conflictingUnitInvitations.length) {
          throw new Meteor.Error('This user was already invited to another case for this unit, but in a different role')
        }
      }

      if (!inviteeUser) {
        // Using Meteor accounts package to create the user with no signup
        Accounts.createUser({
          email,
          profile: {
            isLimited: true
          }
        })

        console.log(`new user created for ${email}`)

        inviteeUser = Accounts.findUserByEmail(email)
      }

      // Updating the invitee user with the details of the invitation
      Meteor.users.update(inviteeUser._id, {
        $push: {
          invitedToCases: {
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

      console.log('Invitee updated', inviteeUser._id, Meteor.users.findOne(inviteeUser._id).invitedToCases)

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
    }
  }
})

export const PendingInvitations = new Mongo.Collection(collectionName)
