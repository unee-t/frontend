export const ATTACHMENT_UPLOADING = 'attachment_uploading'
export const ATTACHMENT_UPLOAD_PROGRESS = 'attachment_upload_progress'
export const ATTACHMENT_UPLOAD_ERROR = 'attachment_upload_error'
export const ATTACHMENT_UPLOAD_COMPLETED = 'attachment_upload_completed'
export const RETRY_ATTACHMENT = 'retry_attachment'
export const CREATE_ATTACHMENT = 'create_attachment'
export const CREATE_COMMENT = 'create_comment'
export const ADD_ROLE_USER = 'add_role_user'
export const REMOVE_ROLE_USER = 'remove_role_user'
export const INVITE_NEW_USER = 'invite_new_user'
export const INVITATION_INITIATED = 'invitation_initiated'
export const INVITATION_SUCCESS = 'invitation_success'
export const INVITATION_ERROR = 'invitation_error'
export const INVITATION_CLEARED = 'invitation_cleared'

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

export function addRoleUser (userEmail, caseId) {
  return {
    type: ADD_ROLE_USER,
    userEmail,
    caseId
  }
}

export function removeRoleUser (userEmail, caseId) {
  return {
    type: REMOVE_ROLE_USER,
    userEmail,
    caseId
  }
}

export function inviteNewUser (email, role, isOccupant, caseId, unitId) {
  return {
    type: INVITE_NEW_USER,
    email,
    role,
    isOccupant,
    caseId,
    unitId
  }
}

export function clearInvitation () {
  return {
    type: INVITATION_CLEARED
  }
}
