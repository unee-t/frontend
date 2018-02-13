export const FETCH_INVITATION_CREDENTIALS = 'fetch_invitation_credentials'
export const LOADING_INVITATION_CREDENTIALS = 'loading_invitation_credentials'
export const ERROR_INVITATION_CREDENTIALS = 'error_invitation_credentials'
export const LOGIN_INVITATION_CREDENTIALS = 'login_invitation_credentials'
export const SUCCESS_INVITATION_CREDENTIALS = 'success_invitation_credentials'
export const CLEAR_ERROR_MESSAGE = 'clear_error_message_invitation_credentials'

export function fetchInvitationCredentials (code) {
  return {
    type: FETCH_INVITATION_CREDENTIALS,
    code
  }
}

export function clearErrorMessage () {
  return {
    type: CLEAR_ERROR_MESSAGE
  }
}
