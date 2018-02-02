import { Meteor } from 'meteor/meteor'
import { Subject } from 'rxjs/Subject'
import { merge } from 'rxjs/observable/merge'
import { of } from 'rxjs/observable/of'
import { push } from 'react-router-redux'
import {
  CREATE_CASE,
  CREATE_CASE_INITIATED,
  CREATE_CASE_ERROR,
  CREATE_CASE_SUCCESS
} from '../../ui/case-wizard/case-wizard.actions'
import { collectionName } from '../../api/cases'

import 'rxjs/add/operator/take'
import 'rxjs/add/operator/mergeMap'

export const createCase = action$ => action$
  .ofType(CREATE_CASE)
  .filter(() => !!Meteor.userId()) // fail safe, but shouldn't happen
  .mergeMap(({params}) => {
    const meteorResult$ = (new Subject())
      .take(1)
      .mergeMap(({error, result: {newCaseId}}) => {
        if (error) {
          return of({
            type: CREATE_CASE_ERROR,
            errorText: error.error
          })
        }
        return merge(
          of({
            type: CREATE_CASE_SUCCESS
          }),
          of(push(`/case/${newCaseId}`))
        )
      })
    Meteor.call(
      `${collectionName}.insert`, params, (error, result) => {
        if (error) {
          console.error('Case creation error', error)
        }
        meteorResult$.next({error, result: result || {}})
      }
    )
    return merge(
      of({
        type: CREATE_CASE_INITIATED
      }),
      meteorResult$
    )
  })
