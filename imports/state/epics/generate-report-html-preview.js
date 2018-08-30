import { Meteor } from 'meteor/meteor'
import { Subject } from 'rxjs/Subject'
import { merge } from 'rxjs/observable/merge'
import { of } from 'rxjs/observable/of'
import {
  GENERATE_HTML_PREVIEW,
  HTMLPreviewInProgress,
  HTMLPreviewReady
} from '../../ui/report-preview/report-preview.actions'
import { genericErrorOccurred } from '../../ui/general-actions'

import { collectionName } from '../../api/reports'

export const generateReportHTMLPreview = action$ => action$
  .ofType(GENERATE_HTML_PREVIEW)
  .switchMap(({ reportId }) => {
    const meteorResult$ = new Subject()
    Meteor.call(`${collectionName}.makePreview`, parseInt(reportId), (err, response) => {
      if (err) {
        meteorResult$.next(
          genericErrorOccurred(`Failed to generate report preview due to: ${err.error}`)
        )
        meteorResult$.next(HTMLPreviewReady(reportId, ''))
      } else {
        meteorResult$.next(HTMLPreviewReady(reportId, response.url))
      }
      meteorResult$.complete()
    })
    return merge(
      meteorResult$,
      of(HTMLPreviewInProgress(reportId))
    )
  })
