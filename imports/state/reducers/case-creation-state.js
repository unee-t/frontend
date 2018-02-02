import {
  CREATE_CASE_INITIATED,
  CREATE_CASE_ERROR,
  CREATE_CASE_SUCCESS,
  CREATE_CASE_CLEAR_ERROR
} from '../../ui/case-wizard/case-wizard.actions'

const idleState = {inProgress: false, error: null}
export default function caseCreationState (state = idleState, action) {
  switch (action.type) {
    case CREATE_CASE_INITIATED:
      return Object.assign({}, state, {inProgress: true})
    case CREATE_CASE_ERROR:
      return Object.assign({}, state, {error: action.errorText})
    case CREATE_CASE_SUCCESS:
      return Object.assign({}, idleState)
    case CREATE_CASE_CLEAR_ERROR:
      if (state.error) {
        return Object.assign({}, idleState)
      }
  }
  return state
}
