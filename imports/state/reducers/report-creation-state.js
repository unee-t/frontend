import {
  CREATE_REPORT_INITIATED,
  CREATE_REPORT_ERROR,
  CREATE_REPORT_SUCCESS,
  CREATE_REPORT_ERROR_CLEARED
} from '../../ui/report-wizard/report-wizard.actions'

const idleState = { inProgress: false, error: null }
export default function reportCreationState (state = idleState, action) {
  switch (action.type) {
    case CREATE_REPORT_INITIATED:
      return Object.assign({}, state, { inProgress: true })
    case CREATE_REPORT_ERROR:
      return Object.assign({}, state, { error: action.errorText, inProgress: false })
    case CREATE_REPORT_SUCCESS:
      return Object.assign({}, idleState)
    case CREATE_REPORT_ERROR_CLEARED:
      return Object.assign({}, state, { error: undefined })
  }
  return state
}
