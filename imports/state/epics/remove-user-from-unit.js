// @flow
import fallibleMethodCaller from './base/fallible-method-caller'
import { REMOVE_FROM_UNIT, removeStarted, removeError, removeSuccess } from '../actions/unit-invite.actions'
import { collectionName } from '/imports/api/unit-roles-data'

export const removeUserFromUnit = fallibleMethodCaller({
  actionType: REMOVE_FROM_UNIT,
  methodName: `${collectionName}.removeMember`,
  argTranslator: ({ userEmail, unitBzId }) => [
    userEmail, unitBzId
  ],
  actionGenerators: {
    initGen: ({ userEmail, unitBzId }) => removeStarted(userEmail, unitBzId),
    errorGen: (error, { userEmail, unitBzId }) => removeError(userEmail, unitBzId, error),
    successGen: ({ userEmail, unitBzId }) => removeSuccess(userEmail, unitBzId)
  }
})
