/* global FormData */

import { Meteor } from 'meteor/meteor'
import { merge } from 'rxjs/observable/merge'
import { of } from 'rxjs/observable/of'
import { onErrorResumeNext } from 'rxjs/observable/onErrorResumeNext'
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
import 'rxjs/add/operator/takeUntil'
import 'rxjs/add/operator/bufferTime'
import 'rxjs/add/operator/take'

export const createAttachment = (action$, store, { ajax }) => {
  const { CLOUDINARY_URL, CLOUDINARY_PRESET } = Meteor.settings.public

  // Creating a stream to public upload progress actions
  const buildProgressStream = action => (new Subject())
    .filter(evt => evt.lengthComputable)
    .map(evt => ({
      ...action,
      type: ATTACHMENT_UPLOAD_PROGRESS,
      percent: Math.round(evt.loaded / evt.total * 100)
    }))

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
    }).mergeMap(result => // For any successful call
      merge( // Publish both "COMPLETED" and "CREATE_COMMENT"
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
    ).catch(error => of({ // Catching AJAX errors and publishing "ERROR"
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

      // Produces a stream that can output up to 1 value per "timeoutMs", but also outputs immediately if no value was
      //   sent as input for more than "timeoutMs"
      const steadyStream = (() => {
        const bufferedStream = (stream, timeoutMs) => stream
          .bufferTime(timeoutMs)
          .take(1)
          .mergeMap(values => {
            if (values.length) {
              return merge(
                of(values.slice(-1)[0]),
                bufferedStream(stream, timeoutMs)
              )
            } else {
              return steadyStream(stream, timeoutMs)
            }
          })
        return (stream, timeoutMs) => stream
          .take(1)
          .mergeMap(val => merge(
            of(val),
            bufferedStream(stream, timeoutMs)
          ))
      })()

      const steadyProgress$ = steadyStream(onErrorResumeNext(progress$), 1000).takeUntil(ajax$)

      return merge( // Publish an initial "UPLOADING" action, and the AJAX and progress streams that will dispatch later
        of({
          ...action,
          type: ATTACHMENT_UPLOADING
        }),
        ajax$,
        steadyProgress$
      )
    })
}
