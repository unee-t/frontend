import { Meteor } from 'meteor/meteor'
import { Subject } from 'rxjs/Subject'
import { merge } from 'rxjs/observable/merge'
import { of } from 'rxjs/observable/of'
import { replace } from 'react-router-redux'
import {
  CREATE_UNIT,
  CREATE_UNIT_ERROR,
  CREATE_UNIT_SUCCESS,
  CREATE_UNIT_INITIATED
} from '../../ui/unit-wizard/unit-wizard.actions'
import { collectionName } from '../../api/units'

import 'rxjs/add/operator/take'
import 'rxjs/add/operator/mergeMap'
import 'rxjs/add/operator/filter'

export const createUnit = action$ => action$
  .ofType(CREATE_UNIT)
  .filter(() => !!Meteor.userId()) // fail safe, but shouldn't happen
  .mergeMap(({ creationArgs }) => {
    const meteorResult$ = (new Subject())
      .take(1)
      .mergeMap(({ error, result: { newUnitId } }) => {
        if (error) {
          return of({
            type: CREATE_UNIT_ERROR,
            errorText: error.error
          })
        }
        return merge(
          of({
            type: CREATE_UNIT_SUCCESS
          }),
          of(replace(`/unit/${newUnitId}`))
        )
      })
    Meteor.call(
      `${collectionName}.insert`, creationArgs, (error, result) => {
        if (error) {
          console.error('Unit creation error', error)
        }
        meteorResult$.next({ error, result: result || {} })
      }
    )
    return merge(
      of({
        type: CREATE_UNIT_INITIATED
      }),
      meteorResult$
    )
  })
