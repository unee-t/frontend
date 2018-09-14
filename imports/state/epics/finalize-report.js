import { Meteor } from 'meteor/meteor'
import { Subject } from 'rxjs/Subject'
import { go } from 'react-router-redux'
import { of } from 'rxjs/observable/of'
import { merge } from 'rxjs/observable/merge'
import { collectionName } from '../../api/reports'
import { FINALIZE_REPORT } from '../../ui/report-wizard/report-wizard.actions'
import { genericErrorOccurred } from '../../ui/general-actions'

import 'rxjs/add/operator/mergeMap'

export const finalizeReport = action$ =>
  action$.ofType(FINALIZE_REPORT)
    .filter(() => !!Meteor.userId()) // fail safe, but shouldn't happen
    .mergeMap(({ reportId, signatureMap }) => {
      const meteorResult$ = new Subject()
      Meteor.call(`${collectionName}.finalize`, parseInt(reportId), signatureMap, err => {
        if (err) {
          meteorResult$.next(
            genericErrorOccurred(`Failed to finalize report ${reportId} due to: "${err.error}"`)
          )
        }

        meteorResult$.complete()
      })
      return merge(
        of(go(-2)),
        meteorResult$
      )
    })
