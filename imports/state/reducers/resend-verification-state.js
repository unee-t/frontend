import { RESEND_ERROR, RESEND_SUCCESS } from '../../ui/unverified-warning/unverified-warning.actions'

export default function resendVerificationState (state = {}, {type, error}) {
  switch (type) {
    case RESEND_ERROR:
      return Object.assign({}, state, {error})
    case RESEND_SUCCESS:
      return Object.assign({}, state, {resendSuccess: true})
    default:
      return state
  }
}
