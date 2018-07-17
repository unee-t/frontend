import { GENERIC_ERROR_CLEARED, GENERIC_ERROR_OCCURRED } from '../../ui/general-actions'

export default function (state = [], { type, errorText, errorIdx }) {
  let changedState
  switch (type) {
    case GENERIC_ERROR_OCCURRED:
      changedState = state.slice()
      changedState.push(errorText)
      return changedState
    case GENERIC_ERROR_CLEARED:
      changedState = state.slice()
      changedState.splice(errorIdx, 1)
      return changedState
    default:
      return state
  }
}
