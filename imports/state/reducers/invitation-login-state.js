import {
  LOADING_INVITATION_CREDENTIALS,
  ERROR_INVITATION_CREDENTIALS,
  LOGIN_INVITATION_CREDENTIALS,
  SUCCESS_INVITATION_CREDENTIALS,
  CLEAR_ERROR_MESSAGE
} from '../../ui/invitation-login/invitation-login.actions'

export default function invitationLoginState (state = {}, action) {
  switch (action.type) {
    case LOADING_INVITATION_CREDENTIALS:
      return {
        loadingCredentials: true
      }
    case ERROR_INVITATION_CREDENTIALS:
      return {
        error: action.error
      }
    case LOGIN_INVITATION_CREDENTIALS:
      return {
        loginInProgress: true
      }
    case SUCCESS_INVITATION_CREDENTIALS:
      return {
        showWelcomeMessage: true
      }
    case CLEAR_ERROR_MESSAGE:
      if (state.error) {
        return {}
      } else {
        return state
      }
    // case CLEAR_WELCOME_MESSAGE:
    //   return {}
  }
  return state
}
