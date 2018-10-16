import fallibleMethodCaller from './base/fallible-method-caller'
import { INVITE_TO_UNIT, inviteStarted, inviteError, inviteSuccess } from '../actions/unit-invite.actions'
import { collectionName } from '/imports/api/unit-roles-data'

export const inviteNewUserToUnit = fallibleMethodCaller({
  actionType: INVITE_TO_UNIT,
  methodName: `${collectionName}.addNewMember`,
  argTranslator: ({ userEmail, firstName, lastName, unitBzId, roleType, isOccupant }) => [
    firstName, lastName, userEmail, roleType, isOccupant, unitBzId
  ],
  actionGenerators: {
    initGen: ({ userEmail, unitBzId }) => inviteStarted(userEmail, unitBzId),
    errorGen: (error, { userEmail, unitBzId }) => inviteError(userEmail, unitBzId, error),
    successGen: ({ userEmail, unitBzId }) => inviteSuccess(userEmail, unitBzId)
  }
})
