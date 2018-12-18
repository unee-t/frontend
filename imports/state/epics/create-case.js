import { Meteor } from 'meteor/meteor'
import { Subject } from 'rxjs/Subject'
import { merge } from 'rxjs/observable/merge'
import { of } from 'rxjs/observable/of'
import { replace, goBack } from 'react-router-redux'
import {
  CREATE_CASE,
  CREATE_CASE_INITIATED,
  CREATE_CASE_ERROR,
  CREATE_CASE_SUCCESS
} from '../../ui/case-wizard/case-wizard.actions'
import { collectionName } from '../../api/cases'

import 'rxjs/add/operator/take'
import 'rxjs/add/operator/mergeMap'
import 'rxjs/add/operator/filter'

export const createCase = action$ => action$
  .ofType(CREATE_CASE)
  .filter(() => !!Meteor.userId()) // fail safe, but shouldn't happen
  .mergeMap(({ params, newUserEmail, newUserIsOccupant, parentReport }) => {
    const meteorResult$ = (new Subject())
      .take(1)
      .mergeMap(({ error, result: { newCaseId } }) => {
        if (error) {
          return of({
            type: CREATE_CASE_ERROR,
            errorText: error.error
          })
        }
        const navAction = parentReport
          ? goBack()
          : replace(`/case/${newCaseId}`)
        return merge(
          of({
            type: CREATE_CASE_SUCCESS
          }),
          of(navAction)
        )
      })
    const parentReportId = parentReport ? parentReport.id : null
    Meteor.call(
      `${collectionName}.insert`, params, { newUserEmail, newUserIsOccupant, parentReportId }, (error, result) => {
        if (error) {
          console.error('Case creation error', error)
        }
        meteorResult$.next({ error, result: result || {} })
      }
    )
    return merge(
      of({
        type: CREATE_CASE_INITIATED
      }),
      meteorResult$
    )
  })
