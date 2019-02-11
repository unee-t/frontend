import { Mongo } from 'meteor/mongo'
import { Meteor } from 'meteor/meteor'
import { Email } from 'meteor/email'
import randToken from 'rand-token'
import { addUserToRole } from './units'
import { findOrCreateUser } from './custom-users'
import UnitMetaData from './unit-meta-data'
import { KEEP_DEFAULT } from './pending-invitations'
import unitUserInvitedTemplate from '../email-templates/unit-user-invited'

export const collectionName = 'unitRolesData'
export const possibleRoles = [
  {
    name: 'Tenant',
    canBeOccupant: true
  },
  {
    name: 'Owner/Landlord',
    canBeOccupant: true
  },
  {
    name: 'Contractor'
  },
  {
    name: 'Management Company'
  },
  {
    name: 'Agent'
  }
]

const UnitRolesData = new Mongo.Collection(collectionName)

const roleDocMemberMatcher = memberId => roleDoc => roleDoc.members.find(member => member.id === memberId)

Meteor.methods({
  [`${collectionName}.addNewMember`] (firstName, lastName, email, roleType, isOccupant, unitBzId) {
    if (!Meteor.userId()) throw new Meteor.Error('not-authorized')

    if (Meteor.isServer) {
      const unitRoles = UnitRolesData.find({ unitBzId }).fetch()

      // Validating current user's permission to add
      const invitorRole = unitRoles.find(roleDocMemberMatcher(Meteor.userId()))
      if (!invitorRole) throw new Meteor.Error('You are not listed as role holder in this unit')

      // Checking if a user exists for this email, create a new one if he isn't
      const inviteeUser = findOrCreateUser(email)

      // Checking if the invitee already has a role (can happen if an existing user was found in the previous step)
      const isInviteeAlreadyAdded = unitRoles.find(roleDocMemberMatcher(inviteeUser._id))
      if (isInviteeAlreadyAdded) {
        throw new Meteor.Error(
          'The invited user already has a role in this unit. A user can have only one role in a unit'
        )
      }

      // Using first/last name even for an existing user, if not defined yet
      if (!inviteeUser.profile.name) {
        Meteor.users.update({
          _id: inviteeUser._id
        }, {
          $set: {
            'profile.name': `${firstName} ${lastName}`,
            'profile.firstName': firstName,
            'profile.lastName': lastName
          }
        })
      }
      const invitingUser = Meteor.user()
      addUserToRole(invitingUser, inviteeUser, unitBzId, roleType, KEEP_DEFAULT, isOccupant, {
        method: `${collectionName}.addNewMember`,
        user: Meteor.userId(),
        args: [firstName, lastName, email, roleType, isOccupant, unitBzId]
      }, true)

      // Creating an invitation token for invitee access
      const accessToken = randToken.generate(24)
      Meteor.users.update({
        _id: inviteeUser._id,
        'receivedInvites.unitId': unitBzId
      }, {
        $set: {
          'receivedInvites.$.accessToken': accessToken
        }
      })
      const unitMetaData = UnitMetaData.findOne({ bzId: unitBzId })
      const unitTitle = unitMetaData.displayName || unitMetaData.bzName
      const unitDescription = unitMetaData.moreInfo

      Email.send({
        ...unitUserInvitedTemplate({
          invitor: Meteor.user(),
          invitee: invitingUser,
          inviteeRoleType: roleType,
          invitorRoleType: invitorRole.roleType,
          unitTitle,
          unitDescription,
          accessToken
        }),
        to: inviteeUser.emails[0].address,
        from: process.env.FROM_EMAIL
      })
    }
  }
})

export default UnitRolesData
