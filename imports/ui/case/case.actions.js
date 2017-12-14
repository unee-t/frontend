/* global FormData, XMLHttpRequest */

import { Meteor } from 'meteor/meteor'

export const ATTACHMENT_UPLOADING = 'attachment_uploading'
export const ATTACHMENT_UPLOAD_PROGRESS = 'attachment_upload_progress'
export const ATTACHMENT_UPLOAD_ERROR = 'attachment_upload_error'

export function createComment (text, caseId) {
  return () => {
    Meteor.call('comments.insert', text, parseInt(caseId))
  }
}

export function createAttachment (preview, file, caseId) {
  const envVars = Meteor.settings.public
  return (dispatch) => {
    if (!Meteor.userId()) return // fail safe, but shouldn't happen

    // Signalling that the current attachment is being uploaded to this case
    dispatch({
      type: ATTACHMENT_UPLOADING,
      preview,
      file,
      caseId
    })

    // Creating a payload for the request
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', Meteor.userId())
    formData.append('upload_preset', envVars.CLOUDINARY_PRESET)

    // Using XHR as the upload transport
    const xhr = new XMLHttpRequest()

    // Uploading directly to Cloudinary servers and not ours
    xhr.open('post', envVars.CLOUDINARY_URL)
    xhr.send(formData)
    xhr.onerror = () => {
      // Signalling that an error has occurred during the upload
      dispatch({
        type: ATTACHMENT_UPLOAD_ERROR,
        error: 'Upload failed',
        caseId
      })
      console.error('Something bad happened', xhr)
    }

    // Using the progress event to calculate the upload completion percentage and signal it to the reducer
    xhr.upload.addEventListener('progress', (evt) => {
      if (evt.lengthComputable) {
        dispatch({
          type: ATTACHMENT_UPLOAD_PROGRESS,
          percent: Math.round(evt.loaded / evt.total * 100),
          caseId
        })
      }
    })
    xhr.onload = () => {
      console.log('bla', xhr)

      const response = JSON.parse(xhr.responseText)
      console.log('Upload success!', response.secure_url)
      // Using the uploaded file's URL retrieved from Cloudinary API to create a special typed text comment
      createComment('[!attachment]\n' + response.secure_url, caseId)(dispatch)
    }
  }
}
