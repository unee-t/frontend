import { ERROR, SUCCESS } from '../../ui/unverified-warning/unverified-warning.actions'

export default function resendVerificationState (state = {}, {type, error}) {
  switch (type) {
    case ERROR:
      return Object.assign({}, state, {error})
    case SUCCESS:
      return Object.assign({}, state, {resendSuccess: true})
    default:
      return state
  }
}
