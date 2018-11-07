import { Meteor } from 'meteor/meteor'
import { Subject } from 'rxjs/Subject'
import { merge } from 'rxjs/observable/merge'
import { of } from 'rxjs/observable/of'
import {
  EMAIL_PDF_ATTACHMENT,
  emailPdfAttachmentSuccess,
  emailPdfAttachmentReset,
  emailPdfAttachmentInProgress
} from '../actions/report-share.actions'
import {
  genericErrorOccurred
} from '../../ui/general-actions'
import { collectionName } from '../../api/reports'

import 'rxjs/add/operator/map'
import 'rxjs/add/operator/mergeMap'
import 'rxjs/add/operator/filter'

export const sendReportPdf = action$ => action$
  .ofType(EMAIL_PDF_ATTACHMENT)
  .filter(() => !!Meteor.userId()) // fail safe, but shouldn't happen
  .mergeMap(({ reportId, newEmails, selectedRecipients }) => {
    const meteorResult$ = (new Subject())
      .mergeMap(({ error }) => {
        if (error) {
          return merge(
            of(emailPdfAttachmentReset()),
            of(genericErrorOccurred(error.error))
          )
        }
        return of(emailPdfAttachmentSuccess())
      })
    Meteor.call(
      `${collectionName}.shareWithRecipients`, reportId, newEmails, selectedRecipients, error => {
        if (error) {
          console.error('Report email sharing error', error)
        }
        meteorResult$.next({ error })
      }
    )
    return merge(
      of(emailPdfAttachmentInProgress()),
      meteorResult$
    )
  })
