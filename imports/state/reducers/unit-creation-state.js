import {
  CREATE_UNIT_INITIATED,
  CREATE_UNIT_ERROR,
  CREATE_UNIT_SUCCESS,
  CREATE_UNIT_CLEAR_ERROR
} from '../../ui/unit-wizard/unit-wizard.actions'

const idleState = { inProgress: false, error: null }
export default function unitCreationState (state = idleState, action) {
  switch (action.type) {
    case CREATE_UNIT_INITIATED:
      return Object.assign({}, state, { inProgress: true })
    case CREATE_UNIT_ERROR:
      return Object.assign({}, state, { error: action.errorText })
    case CREATE_UNIT_SUCCESS:
      return Object.assign({}, idleState)
    case CREATE_UNIT_CLEAR_ERROR:
      if (state.error) {
        return Object.assign({}, idleState)
      }
  }
  return state
}
