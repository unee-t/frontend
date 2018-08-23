export const CREATE_REPORT = 'create_report'
export const CREATE_REPORT_ERROR = 'create_report_error'
export const CREATE_REPORT_SUCCESS = 'create_report_success'
export const CREATE_REPORT_INITIATED = 'create_report_initiated'
export const FINALIZE_REPORT = 'finalize_report'
export const EDIT_REPORT_FIELD = 'edit_report_field'
export const ADD_ATTACHMENT = 'add_attachment_to_report'
export const RETRY_ATTACHMENT = 'retry_add_attachment_to_report'

export function createReport (unit, title) {
  return {
    type: CREATE_REPORT,
    unit,
    title
  }
}

export function finalizeReport (reportId) {
  return {
    type: FINALIZE_REPORT,
    reportId
  }
}

export function editReportField (reportId, changeSet) {
  return {
    type: EDIT_REPORT_FIELD,
    reportId,
    changeSet
  }
}

export function addAttachment (reportId, preview, file) {
  return {
    type: ADD_ATTACHMENT,
    reportId,
    preview,
    file
  }
}

export function retryAttachment (process) {
  return {
    type: RETRY_ATTACHMENT,
    ...process
  }
}
