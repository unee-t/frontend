import { Meteor } from 'meteor/meteor'
import { Subject } from 'rxjs/Subject'
import { merge } from 'rxjs/observable/merge'
import { of } from 'rxjs/observable/of'
import { push } from 'react-router-redux'
import {
  CREATE_REPORT,
  CREATE_REPORT_ERROR,
  CREATE_REPORT_INITIATED,
  CREATE_REPORT_SUCCESS
} from '../../ui/report-wizard/report-wizard.actions'
import { collectionName } from '../../api/reports'

import 'rxjs/add/operator/take'
import 'rxjs/add/operator/mergeMap'
import 'rxjs/add/operator/filter'

export const createReport = action$ => action$
  .ofType(CREATE_REPORT)
  .filter(() => !!Meteor.userId()) // fail safe, but shouldn't happen
  .mergeMap(({ unit, title }) => {
    const meteorResult$ = (new Subject())
      .take(1)
      .mergeMap(({error, result: {newReportId}}) => {
        if (error) {
          return of({
            type: CREATE_REPORT_ERROR,
            errorText: error.error
          })
        }
        console.log('report success?')

        return merge(
          of({
            type: CREATE_REPORT_SUCCESS
          }),
          of(push(`/report/${newReportId}`))
        )
      })
    const payload = {
      selectedUnit: unit,
      title
    }
    Meteor.call(
      `${collectionName}.insert`, payload, (error, result) => {
        if (error) {
          console.error('Report creation error', error)
        }
        meteorResult$.next({error, result: result || {}})
      }
    )
    return merge(
      of({
        type: CREATE_REPORT_INITIATED
      }),
      meteorResult$
    )
  })
