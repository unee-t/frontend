export const INVITE_TO_UNIT = 'invite_new_user_to_unit'
export const INVITE_STARTED = 'invite_new_user_to_unit_started'
export const INVITE_ERROR = 'invite_new_user_to_unit_error'
export const INVITE_SUCCESS = 'invite_new_user_to_unit_success'
export const INVITE_CLEARED = 'invite_new_user_to_unit_cleared'
export const REMOVE_FROM_UNIT = 'remove_role_user_from_a_unit'
export const REMOVE_STARTED = 'remove_role_user_from_a_unit_started'
export const REMOVE_ERROR = 'remove_role_user_from_a_unit_error'
export const REMOVE_SUCCESS = 'remove_role_user_from_a_unit_success'
export const REMOVE_CLEARED = 'remove_role_user_from_a_unit_cleared'

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

export function removeFromUnit (userEmail, unitBzId) {
  return {
    type: REMOVE_FROM_UNIT,
    userEmail,
    unitBzId
  }
}

export function removeStarted (userEmail, unitBzId) {
  return {
    type: REMOVE_STARTED,
    userEmail,
    unitBzId
  }
}

export function removeError (userEmail, unitBzId, error) {
  return {
    type: REMOVE_ERROR,
    userEmail,
    unitBzId,
    error
  }
}

export function removeSuccess (userEmail, unitBzId) {
  return {
    type: REMOVE_SUCCESS,
    userEmail,
    unitBzId
  }
}

export function removeCleared (userEmail, unitBzId) {
  return {
    type: REMOVE_CLEARED,
    userEmail,
    unitBzId
  }
}
