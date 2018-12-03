// @flow
import { collectionName } from '/imports/api/case-notifications'
import { MARK_NOTIFICATIONS_AS_READ } from '../../ui/case/case.actions'
import { detachedMethodCaller } from './base/detached-method-caller'

type Action = {
  type: string,
  caseId: string|number
}
export const markCaseCommentsAsRead = detachedMethodCaller < Action > ({
  actionType: MARK_NOTIFICATIONS_AS_READ,
  methodName: `${collectionName}.markAsRead`,
  argTranslator: ({ caseId }) => [parseInt(caseId)]
})
