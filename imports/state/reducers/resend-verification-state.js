import { RESEND_SUCCESS } from '../../ui/components/unverified-warning.actions'

export default function resendVerificationState (state = {}, {type, error}) {
  switch (type) {
    case RESEND_SUCCESS:
      return Object.assign({}, state, {resendSuccess: true})
    default:
      return state
  }
}
