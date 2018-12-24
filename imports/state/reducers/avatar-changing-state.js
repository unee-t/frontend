// @flow
import {
  UPLOAD_AVATAR_IMAGE_STARTED,
  UPLOAD_AVATAR_IMAGE_PROGRESS,
  UPLOAD_AVATAR_IMAGE_ERROR,
  UPLOAD_AVATAR_IMAGE_COMPLETED,
  CHANGE_AVATAR_URL_COMPLETED,
  CHANGE_AVATAR_URL_ERROR,
  DISMISS_CHANGE_AVATAR_ERROR
} from '../actions/account-edit.actions'

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
    case UPLOAD_AVATAR_IMAGE_STARTED:
      return { ...state, inProgress: true }
    case UPLOAD_AVATAR_IMAGE_PROGRESS:
      return { ...state, inProgress: true, percent: action.percent }
    case UPLOAD_AVATAR_IMAGE_ERROR:
      return { ...state, inProgress: false, error: action.error }
    case UPLOAD_AVATAR_IMAGE_COMPLETED:
      return { ...state, percent: 0, fileUploaded: true, inProgress: true }
    case CHANGE_AVATAR_URL_ERROR:
      return { ...state, inProgress: false, error: action.error }
    case CHANGE_AVATAR_URL_COMPLETED:
    case DISMISS_CHANGE_AVATAR_ERROR:
      return idleState
  }
  return state
}
