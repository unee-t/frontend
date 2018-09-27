import {
  EMAIL_PDF_ATTACHMENT_IN_PROGRESS,
  EMAIL_PDF_ATTACHMENT_RESET,
  EMAIL_PDF_ATTACHMENT_SUCCESS
} from '../actions/report-share.actions'

const idleState = {inProgress: false, success: false}
export default function reportSharingState (state = idleState, action) {
  switch (action.type) {
    case EMAIL_PDF_ATTACHMENT_IN_PROGRESS:
      return {inProgress: true, success: false}
    case EMAIL_PDF_ATTACHMENT_SUCCESS:
      return {inProgress: false, success: true}
    case EMAIL_PDF_ATTACHMENT_RESET:
      return {inProgress: false, success: false}
  }
  return state
}
