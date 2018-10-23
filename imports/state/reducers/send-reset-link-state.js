import { ERROR, RESET_ERROR, SUCCESS, SUCCESS_CLEAR, FORGOT_PASS_PROCESS } from '../../ui/forgot-pass/forgot-pass.actions'

export default function (state = {}, {type, error, email}) {
  let processingState
  switch (type) {
    case FORGOT_PASS_PROCESS:
      processingState = {processing: true}
      break
    case ERROR:
    case RESET_ERROR:
    case SUCCESS:
    case SUCCESS_CLEAR:
      processingState = {processing: false}
  }

  switch (type) {
    case FORGOT_PASS_PROCESS:
      const { error: e0, ...newState0 } = state
      return Object.assign(newState0, processingState)
    case ERROR:
      return Object.assign({}, state, {error}, processingState)
    case RESET_ERROR:
      const { error: e1, ...newState1 } = state
      return newState1
    case SUCCESS:
      return Object.assign({}, state, {successfulEmail: email}, processingState)
    case SUCCESS_CLEAR:
      const {successfulEmail: s1, ...newState2} = state
      return Object.assign(newState2, processingState)
    default:
      return state
  }
}
