export const INVITE_TO_UNIT = 'invite_new_user_to_unit'
export const INVITE_STARTED = 'invite_new_user_to_unit_started'
export const INVITE_ERROR = 'invite_new_user_to_unit_error'
export const INVITE_SUCCESS = 'invite_new_user_to_unit_success'
export const INVITE_CLEARED = 'invite_new_user_to_unit_cleared'

export function inviteToUnit (userEmail, firstName, lastName, unitBzId, roleType, isOccupant) {
  return {
    type: INVITE_TO_UNIT,
    userEmail,
    firstName,
    lastName,
    unitBzId,
    roleType,
    isOccupant
  }
}

export function inviteStarted (userEmail, unitBzId) {
  return {
    type: INVITE_STARTED,
    userEmail,
    unitBzId
  }
}

export function inviteError (userEmail, unitBzId, error) {
  return {
    type: INVITE_ERROR,
    userEmail,
    unitBzId,
    error
  }
}

export function inviteSuccess (userEmail, unitBzId) {
  return {
    type: INVITE_SUCCESS,
    userEmail,
    unitBzId
  }
}

export function inviteCleared (userEmail, unitBzId) {
  return {
    type: INVITE_CLEARED,
    userEmail,
    unitBzId
  }
}
