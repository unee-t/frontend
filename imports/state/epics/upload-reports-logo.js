// @flow
import { fileUploadProcessor } from './base/file-upload-processor'
import {
  CHANGE_REPORTS_LOGO,
  uploadReportsLogoStarted,
  uploadReportsLogoProgress,
  uploadReportLogoError,
  uploadReportLogoCompleted,
  changeLogoUrl
} from '../actions/report-settings.actions'

export const uploadReportsLogo = fileUploadProcessor(CHANGE_REPORTS_LOGO, {
  init: () => uploadReportsLogoStarted(),
  progress: (action, percent) => uploadReportsLogoProgress(percent),
  error: (action, error) => uploadReportLogoError(error),
  complete: (action, uploadedUrl) => [
    uploadReportLogoCompleted(),
    changeLogoUrl(uploadedUrl)
  ]
})
