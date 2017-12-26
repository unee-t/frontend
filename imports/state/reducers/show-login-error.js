import { LOGIN_ERROR, LOGIN_PROCESS } from '../../ui/login/login.actions'

export default function showLoginError (state = '', action) {
  switch (action.type) {
    case LOGIN_ERROR:
      return action.value.message
    case LOGIN_PROCESS:
      return ''
    default:
      return state
  }
}
