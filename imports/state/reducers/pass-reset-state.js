import { PASS_RESET_REQUESTED } from '../../ui/app.actions'
import { RESET_PASS_COMPLETE, RESET_PASS_ERROR } from '../../ui/reset-pass/reset-pass.actions'

export default function (state = {}, { type, token, done, error }) {
  switch (type) {
    case PASS_RESET_REQUESTED:
      return {
        token,
        done,
        isRequested: true
      }
    case RESET_PASS_ERROR:
      return Object.assign({ error }, state)
    case RESET_PASS_COMPLETE: {
      return {}
    }
    default:
      return state
  }
}
