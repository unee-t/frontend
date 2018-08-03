export const CREATE_REPORT = 'create_report'
export const CREATE_REPORT_ERROR = 'create_report_error'
export const CREATE_REPORT_SUCCESS = 'create_report_success'
export const CREATE_REPORT_INITIATED = 'create_report_initiated'
export const FINALIZE_REPORT = 'finalize_report'

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
