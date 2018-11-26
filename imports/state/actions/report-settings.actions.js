// @flow
/* global File */
export const CHANGE_REPORTS_LOGO = 'change_reports_logo_general_setting'
export const UPLOAD_REPORTS_LOGO_STARTED = 'upload_reports_logo_started'
export const UPLOAD_REPORTS_LOGO_PROGRESS = 'upload_reports_logo_progress'
export const UPLOAD_REPORTS_LOGO_ERROR = 'upload_reports_logo_error'
export const UPLOAD_REPORTS_LOGO_COMPLETED = 'upload_reports_logo_completed'
export const CHANGE_LOGO_URL = 'change_logo_url'
export const CHANGE_LOGO_URL_STARTED = 'change_logo_url_started'
export const CHANGE_LOGO_URL_ERROR = 'change_logo_url_error'
export const CHANGE_LOGO_URL_COMPLETED = 'change_logo_url_completed'
export const DISMISS_CHANGE_LOGO_ERROR = 'change_reports_logo_general_setting_error_dismissed'
export const RESET_REPORTS_LOGO = 'reset_reports_logo_general_setting'
export const RESET_REPORTS_LOGO_STARTED = 'reset_reports_logo_started'
export const RESET_REPORTS_LOGO_COMPLETED = 'reset_reports_logo_completed'

export function changeReportsLogo (file: File) {
  return {
    type: CHANGE_REPORTS_LOGO,
    file
  }
}
export function uploadReportsLogoStarted () {
  return {
    type: UPLOAD_REPORTS_LOGO_STARTED
  }
}
export function uploadReportsLogoProgress (percent: number) {
  return {
    type: UPLOAD_REPORTS_LOGO_PROGRESS,
    percent
  }
}
export function uploadReportLogoError (error: {}) {
  return {
    type: UPLOAD_REPORTS_LOGO_ERROR,
    error
  }
}
export function uploadReportLogoCompleted () {
  return {
    type: UPLOAD_REPORTS_LOGO_COMPLETED
  }
}
export function changeLogoUrl (url: string) {
  return {
    type: CHANGE_LOGO_URL,
    url
  }
}
export function changeLogoUrlStarted () {
  return {
    type: CHANGE_LOGO_URL_STARTED
  }
}
export function changeLogoUrlError (error: {}) {
  return {
    type: CHANGE_LOGO_URL_ERROR,
    error
  }
}
export function changeLogoUrlCompleted () {
  return {
    type: CHANGE_LOGO_URL_COMPLETED
  }
}
export function dismissChangeLogoError () {
  return {
    type: DISMISS_CHANGE_LOGO_ERROR
  }
}

export function resetReportsLogo () {
  return {
    type: RESET_REPORTS_LOGO
  }
}

export function resetReportsLogoStarted () {
  return {
    type: RESET_REPORTS_LOGO_STARTED
  }
}

export function resetReportsLogoCompleted () {
  return {
    type: RESET_REPORTS_LOGO_COMPLETED
  }
}
