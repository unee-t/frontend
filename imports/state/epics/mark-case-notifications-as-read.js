import { Meteor } from 'meteor/meteor'
import { MARK_NOTIFICATIONS_AS_READ } from '../../ui/case/case.actions'
import { collectionName } from '../../api/case-notifications'

import 'rxjs/add/operator/do'
import 'rxjs/add/operator/ignoreElements'

export const markCaseCommentsAsRead = action$ =>
  action$.ofType(MARK_NOTIFICATIONS_AS_READ)
    .filter(() => !!Meteor.userId()) // fail safe, but shouldn't happen
    .do(({ caseId }) => Meteor.call(`${collectionName}.markAsRead`, parseInt(caseId)))
    .ignoreElements()
