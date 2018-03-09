import { ERROR, RESET_ERROR, SUCCESS, SUCCESS_CLEAR } from '../../ui/forgot-pass/forgot-pass.actions'

export default function (state = {}, {type, error, email}) {
  switch (type) {
    case ERROR:
      return Object.assign({}, state, {error})
    case RESET_ERROR:
      const { error: e1, ...newState1 } = state
      return newState1
    case SUCCESS:
      return Object.assign({}, state, {successfulEmail: email})
    case SUCCESS_CLEAR:
      const {successfulEmail: s1, ...newState2} = state
      return newState2
    default:
      return state
  }
}
