import { Meteor } from 'meteor/meteor'
import { merge } from 'rxjs/observable/merge'
import { of } from 'rxjs/observable/of'
import { RETRY_ATTACHMENT, ATTACHMENT_UPLOAD_COMPLETED, createAttachment } from '../../ui/case/case.actions'

import 'rxjs/add/operator/mergeMap'
import 'rxjs/add/operator/filter'

export const retryAttachment = action$ => action$
  .ofType(RETRY_ATTACHMENT)
  .filter(() => !!Meteor.userId()) // fail safe, but shouldn't happen
  .mergeMap(({preview, file, caseId, processId}) => merge(
    of({
      type: ATTACHMENT_UPLOAD_COMPLETED,
      processId,
      caseId
    }),
    of(createAttachment(preview, file, caseId, processId))
  ))
