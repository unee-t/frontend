export const ATTACHMENT_UPLOADING = 'attachment_uploading'
export const ATTACHMENT_UPLOAD_PROGRESS = 'attachment_upload_progress'
export const ATTACHMENT_UPLOAD_ERROR = 'attachment_upload_error'
export const ATTACHMENT_UPLOAD_COMPLETED = 'attachment_upload_completed'
export const RETRY_ATTACHMENT = 'retry_attachment'
export const CREATE_ATTACHMENT = 'create_attachment'
export const CREATE_COMMENT = 'create_comment'

export function createComment (text, caseId) {
  return {
    type: CREATE_COMMENT,
    text,
    caseId
  }
}

export function createAttachment (preview, file, caseId, processId) {
  processId = processId || Math.round(Math.random() * Number.MAX_VALUE)
  return {
    type: CREATE_ATTACHMENT,
    processId,
    preview,
    file,
    caseId
  }
}

export function retryAttachment (process) {
  return {
    type: RETRY_ATTACHMENT,
    ...process
  }
}
