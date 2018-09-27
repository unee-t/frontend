export const EMAIL_PDF_ATTACHMENT = 'send_report_pdf_as_email_attachment'
export const EMAIL_PDF_ATTACHMENT_IN_PROGRESS = 'send_report_pdf_as_email_attachment_is_in_progress'
export const EMAIL_PDF_ATTACHMENT_SUCCESS = 'send_report_pdf_as_email_attachment_success'
export const EMAIL_PDF_ATTACHMENT_RESET = 'send_report_pdf_as_email_attachment_reset_to_idle'

export function emailPdfAttachment (reportId, newEmails, selectedRecipients) {
  return {
    type: EMAIL_PDF_ATTACHMENT,
    reportId,
    newEmails,
    selectedRecipients
  }
}

export function emailPdfAttachmentInProgress () {
  return {
    type: EMAIL_PDF_ATTACHMENT_IN_PROGRESS
  }
}

export function emailPdfAttachmentReset () {
  return {
    type: EMAIL_PDF_ATTACHMENT_RESET
  }
}

export function emailPdfAttachmentSuccess () {
  return {
    type: EMAIL_PDF_ATTACHMENT_SUCCESS
  }
}
