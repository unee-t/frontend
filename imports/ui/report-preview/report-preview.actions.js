export const GENERATE_HTML_PREVIEW = 'generate_report_export_html_preview'
export const HTML_PREVIEW_IN_PROGRESS = 'generate_report_export_html_preview_in_progress'
export const HTML_PREVIEW_READY = 'report_export_html_preview_is_ready'

export function generateHTMLPreview (reportId) {
  return {
    type: GENERATE_HTML_PREVIEW,
    reportId
  }
}

export function HTMLPreviewInProgress (reportId) {
  return {
    type: HTML_PREVIEW_IN_PROGRESS,
    reportId
  }
}

export function HTMLPreviewReady (reportId, url) {
  return {
    type: HTML_PREVIEW_READY,
    reportId,
    url
  }
}
