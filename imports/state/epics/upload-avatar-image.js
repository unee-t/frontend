// @flow
import { fileUploadProcessor } from './base/file-upload-processor'
import {
  UPLOAD_AVATAR_IMAGE,
  uploadAvatarImageStarted,
  uploadAvatarImageProgress,
  uploadAvatarImageError,
  uploadAvatarImageCompleted,
  changeAvatarUrl
} from '../actions/account-edit.actions'

export const uploadAvatarImage = fileUploadProcessor(UPLOAD_AVATAR_IMAGE, {
  init: () => uploadAvatarImageStarted(),
  progress: (action, percent) => uploadAvatarImageProgress(percent),
  error: (action, error) => uploadAvatarImageError(error),
  complete: (action, uploadedUrl) => [
    uploadAvatarImageCompleted(),
    changeAvatarUrl(uploadedUrl)
  ]
})
