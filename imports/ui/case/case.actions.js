export const ATTACHMENT_UPLOADING = 'attachment_uploading'
export const ATTACHMENT_UPLOAD_PROGRESS = 'attachment_upload_progress'
export const ATTACHMENT_UPLOAD_ERROR = 'attachment_upload_error'
export const ATTACHMENT_UPLOAD_COMPLETED = 'attachment_upload_completed'
export const RETRY_ATTACHMENT = 'retry_attachment'
export const CREATE_ATTACHMENT = 'create_attachment'
export const CREATE_COMMENT = 'create_comment'
export const ADD_ROLE_USERS = 'add_role_users'
export const REMOVE_ROLE_USER = 'remove_role_user'
export const ROLE_USERS_ADDED = 'role_users_added_to_case'
export const ROLE_USERS_REMOVED = 'role_users_added_to_case'
export const ROLE_USERS_STATE_ERROR = 'role_users_state_error_on_case'
export const CLEAR_ROLE_USERS_STATE = 'role_users_state_cleared_from_case'
export const INVITE_NEW_USER = 'invite_new_user'
export const ASSIGN_NEW_USER = 'assign_new_user'
export const ASSIGN_EXISTING_USER = 'assign_existing_user'
export const INVITATION_INITIATED = 'invitation_initiated'
export const INVITATION_SUCCESS = 'invitation_success'
export const INVITATION_ERROR = 'invitation_error'
export const INVITATION_CLEARED = 'invitation_cleared'
export const CLEAR_WELCOME_MESSAGE = 'clear_welcome_message'
export const UPDATE_INVITED_USER_NAME = 'update_invited_user_name'
export const EDIT_CASE_FIELD = 'edit_case_field'

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

export function addRoleUsers (userLogins, caseId) {
  return {
    type: ADD_ROLE_USERS,
    userLogins,
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

export function assignNewUser (email, role, isOccupant, caseId, unitId) {
  return {
    type: ASSIGN_NEW_USER,
    email,
    role,
    isOccupant,
    caseId,
    unitId
  }
}

export function assignExistingUser (user, caseId) {
  return {
    type: ASSIGN_EXISTING_USER,
    user,
    caseId
  }
}

export function clearInvitation () {
  return {
    type: INVITATION_CLEARED
  }
}

export function clearWelcomeMessage () {
  return {
    type: CLEAR_WELCOME_MESSAGE
  }
}

export function updateInvitedUserName (name) {
  return {
    type: UPDATE_INVITED_USER_NAME,
    name
  }
}

export function editCaseField (changeSet, caseId) {
  return {
    type: EDIT_CASE_FIELD,
    changeSet,
    caseId
  }
}

export function clearRoleUsersState () {
  return {
    type: CLEAR_ROLE_USERS_STATE
  }
}
