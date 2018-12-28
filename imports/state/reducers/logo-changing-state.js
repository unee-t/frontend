// @flow
import {
  UPLOAD_REPORTS_LOGO_STARTED,
  UPLOAD_REPORTS_LOGO_PROGRESS,
  UPLOAD_REPORTS_LOGO_ERROR,
  UPLOAD_REPORTS_LOGO_COMPLETED,
  CHANGE_LOGO_URL_STARTED,
  CHANGE_LOGO_URL_ERROR,
  CHANGE_LOGO_URL_COMPLETED, DISMISS_CHANGE_LOGO_ERROR
} from '../actions/report-settings.actions'

type State = {
  +inProgress: boolean,
  +percent: number,
  +fileUploaded: boolean,
  +error?: {}
}
type Action = {
  type: string,
  percent?: number,
  error?: {}
}
const idleState = { inProgress: false, percent: 0, fileUploaded: false }
export default function logoChangingState (state: State = idleState, action: Action): State {
  switch (action.type) {
    case UPLOAD_REPORTS_LOGO_STARTED:
      return { ...state, inProgress: true }
    case UPLOAD_REPORTS_LOGO_PROGRESS:
      return { ...state, inProgress: true, percent: action.percent }
    case UPLOAD_REPORTS_LOGO_ERROR:
      return { ...state, inProgress: false, error: action.error }
    case UPLOAD_REPORTS_LOGO_COMPLETED:
      return { ...state, percent: 100, fileUploaded: true, inProgress: false }
    case CHANGE_LOGO_URL_STARTED:
      return { ...state, inProgress: true, percent: 0 }
    case CHANGE_LOGO_URL_ERROR:
      return { ...state, inProgress: false, error: action.error }
    case CHANGE_LOGO_URL_COMPLETED:
    case DISMISS_CHANGE_LOGO_ERROR:
      return idleState
  }
  return state
}
