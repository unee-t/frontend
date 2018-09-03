import {
  HTML_PREVIEW_IN_PROGRESS,
  HTML_PREVIEW_READY
} from '../../ui/report-preview/report-preview.actions'

export default function reportPreviewUrls (state = {}, action) {
  switch (action.type) {
    case HTML_PREVIEW_IN_PROGRESS:
      return {
        ...state,
        [action.reportId.toString()]: {
          inProgress: true
        }
      }
    case HTML_PREVIEW_READY:
      return {
        ...state,
        [action.reportId.toString()]: {
          url: action.url
        }
      }
    default:
      return state
  }
}
