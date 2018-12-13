// @flow
/* global File */
export const EDIT_PROFILE_FIELD = 'edit_user_account_profile_field'
export const UPLOAD_AVATAR_IMAGE = 'upload_this_user_avatar_image_file'
export const UPLOAD_AVATAR_IMAGE_STARTED = 'upload_this_user_avatar_image_file_started'
export const UPLOAD_AVATAR_IMAGE_PROGRESS = 'upload_this_user_avatar_image_file_progress'
export const UPLOAD_AVATAR_IMAGE_ERROR = 'upload_this_user_avatar_image_file_error'
export const UPLOAD_AVATAR_IMAGE_COMPLETED = 'upload_this_user_avatar_image_file_completed'
export const CHANGE_AVATAR_URL = 'change_this_user_avatar_url'
export const CHANGE_AVATAR_URL_COMPLETED = 'change_this_user_avatar_url_completed'
export const CHANGE_AVATAR_URL_ERROR = 'change_this_user_avatar_url_error'
export const DISMISS_CHANGE_AVATAR_ERROR = 'dismiss_change_this_user_avatar_url_error'

export function editProfileField (fieldName: string, fieldValue: string) {
  return {
    type: EDIT_PROFILE_FIELD,
    fieldName,
    fieldValue
  }
}

export function uploadAvatarImage (file: File) {
  return {
    type: UPLOAD_AVATAR_IMAGE,
    file
  }
}

export function uploadAvatarImageStarted () {
  return {
    type: UPLOAD_AVATAR_IMAGE_STARTED
  }
}

export function uploadAvatarImageProgress (percent: number) {
  return {
    type: UPLOAD_AVATAR_IMAGE_PROGRESS,
    percent
  }
}

export function uploadAvatarImageError (error: {}) {
  return {
    type: UPLOAD_AVATAR_IMAGE_ERROR,
    error
  }
}

export function uploadAvatarImageCompleted () {
  return {
    type: UPLOAD_AVATAR_IMAGE_COMPLETED
  }
}

export function changeAvatarUrl (url: string) {
  return {
    type: CHANGE_AVATAR_URL,
    url
  }
}

export function changeAvatarUrlCompleted () {
  return {
    type: CHANGE_AVATAR_URL_COMPLETED
  }
}

export function changeAvatarUrlError (error: {}) {
  return {
    type: CHANGE_AVATAR_URL_ERROR,
    error
  }
}

export function dismissChangeAvatarError () {
  return {
    type: DISMISS_CHANGE_AVATAR_ERROR
  }
}
