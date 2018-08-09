import { SIGNUP_ERROR } from '../../ui/signup/signup.actions'

export default function showSignupError (state = '', action) {
  switch (action.type) {
    case SIGNUP_ERROR:
      return action.value.error.message || action.value.message
    default:
      return state
  }
}
