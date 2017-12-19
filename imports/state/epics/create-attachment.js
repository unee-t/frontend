/* global FormData */

import { Meteor } from 'meteor/meteor'
import { merge } from 'rxjs/observable/merge'
import { of } from 'rxjs/observable/of'
import { interval } from 'rxjs/observable/interval'
import { Subject } from 'rxjs/Subject'
import {
  CREATE_ATTACHMENT,
  CREATE_COMMENT,
  ATTACHMENT_UPLOADING,
  ATTACHMENT_UPLOAD_PROGRESS,
  ATTACHMENT_UPLOAD_COMPLETED,
  ATTACHMENT_UPLOAD_ERROR
} from '../../ui/case/case.actions'

import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/mergeMap'
import 'rxjs/add/operator/catch'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/throttle'

const { CLOUDINARY_URL, CLOUDINARY_PRESET } = Meteor.settings.public

export const createAttachment = (action$, store, { ajax }) => {
  // Creating a stream to public upload progress actions
  const buildProgressStream = action => (new Subject()).map(evt => evt.lengthComputable && {
    ...action,
    type: ATTACHMENT_UPLOAD_PROGRESS,
    percent: Math.round(evt.loaded / evt.total * 100)
  }).throttle(val => interval(1000))

  // Creating a stream to execute the upload and chaining to publish completion, error and "CREATE_COMMENT"
  const buildAjaxStream = (action, progress$) => {
    const { caseId, file } = action

    // Creating the upload payload
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', Meteor.userId())
    formData.append('upload_preset', CLOUDINARY_PRESET)

    return ajax({
      url: CLOUDINARY_URL,
      responseType: 'json',
      method: 'POST',
      body: formData,
      progressSubscriber: progress$
    }).mergeMap(result => { // For any successful call
      return merge( // Publish both "COMPLETED" and "CREATE_COMMENT"
        of({
          ...action,
          type: ATTACHMENT_UPLOAD_COMPLETED
        }),
        of({
          type: CREATE_COMMENT,
          text: '[!attachment]\n' + result.response.secure_url,
          caseId
        })
      )
    }).catch(error => of({ // Catching AJAX errors and publishing "ERROR"
      ...action,
      type: ATTACHMENT_UPLOAD_ERROR,
      errorMessage: 'Upload failed',
      error
    }))
  }

  return action$
    .ofType(CREATE_ATTACHMENT)
    .filter(() => !!Meteor.userId()) // fail safe, but shouldn't happen
    .mergeMap(action => { // For any matching action
      const progress$ = buildProgressStream(action)
      const ajax$ = buildAjaxStream(action, progress$)
      return merge( // Publish an initial "UPLOADING" action, and the AJAX and progress streams that will dispatch later
        of({
          ...action,
          type: ATTACHMENT_UPLOADING
        }),
        ajax$,
        progress$
      )
    })
}
