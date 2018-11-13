import { Meteor } from 'meteor/meteor'
import { Subject } from 'rxjs/Subject'

import { collectionName } from '../../api/comments'
import { CREATE_COMMENT } from '../../ui/case/case.actions'
import { genericErrorOccurred } from '../../ui/general-actions'

import 'rxjs/add/operator/mergeMap'

export const createComment = action$ =>
  action$.ofType(CREATE_COMMENT)
    .filter(() => !!Meteor.userId()) // fail safe, but shouldn't happen
    .mergeMap(({ text, caseId }) => {
      const meteorResult$ = new Subject()
      Meteor.call(`${collectionName}.insert`, text, parseInt(caseId), err => {
        if (err) {
          meteorResult$.next(
            genericErrorOccurred(`Failed to post "${text}" on case ${caseId} due to: "${err.error}"`)
          )
        }
        meteorResult$.complete()
      })
      return meteorResult$
    })
