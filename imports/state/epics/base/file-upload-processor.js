// @flow
/* global FormData, File */

import { Meteor } from 'meteor/meteor'
import { merge } from 'rxjs/observable/merge'
import { of } from 'rxjs/observable/of'
import { Observable } from 'rxjs/Observable'
import { onErrorResumeNext } from 'rxjs/observable/onErrorResumeNext'
import { Subject } from 'rxjs/Subject'

import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/mergeMap'
import 'rxjs/add/operator/catch'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/takeUntil'
import 'rxjs/add/operator/bufferTime'
import 'rxjs/add/operator/take'

type Action = { type: string }
export type InputAction = Action & { file: File }
type ActionGenerators<T> = {
  init: (origAction: T) => Action,
  progress: (origAction: T, percent: number) => Action,
  error: (origAction: T, error: {}) => Action,
  complete: (origAction: T, uploadedUrl: string) => Array<Action> | Action
}
export const fileUploadProcessor = <T: InputAction>(actionType: string, actionGenerators: ActionGenerators<T>) =>
  (action$: Observable, store: {}, deps: { ajax: (opts: {}) => Observable }) => {
    const { CLOUDINARY_URL, CLOUDINARY_PRESET } = Meteor.settings.public

    // Creating a stream to publish upload progress actions
    const buildProgressStream = (action: T) => {
      return (new Subject())
        .filter(evt => evt.lengthComputable)
        .map(evt => actionGenerators.progress(action, Math.round(evt.loaded / evt.total * 100)))
    }

    // Creating a stream to execute the upload and chaining to publish completion, error and "CREATE_COMMENT"
    const buildAjaxStream = (action: T, progress$: Observable) => {
      // Creating the upload payload
      const formData = new FormData()
      formData.append('file', action.file)
      formData.append('folder', Meteor.userId())
      formData.append('upload_preset', CLOUDINARY_PRESET)

      return deps.ajax({
        url: CLOUDINARY_URL,
        responseType: 'json',
        method: 'POST',
        body: formData,
        progressSubscriber: progress$
      }).mergeMap((result: any) => { // For any successful call
        const completeActions = actionGenerators.complete(action, result.response.secure_url)
        if (Array.isArray(completeActions)) {
          return merge(...completeActions.map(action => of(action)))
        } else {
          return completeActions
        }
      }).catch(error => of(actionGenerators.error(action, error))) // Catching AJAX errors and publishing "ERROR"
    }

    return action$
      .ofType(actionType)
      .filter(() => !!Meteor.userId()) // fail safe, but shouldn't happen
      .mergeMap((action: T) => { // For any matching action
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

        // Publish an initial  action, and the AJAX and progress streams that will dispatch later
        return merge(
          of(actionGenerators.init(action)),
          ajax$,
          steadyProgress$
        )
      })
  }
