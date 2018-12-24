// @flow
import { detachedMethodCaller } from './base/detached-method-caller'
import { collectionName } from '../../api/cases'
import { ASSIGN_EXISTING_USER } from '../../ui/case/case.actions'

type Action = {
  type: string,
  user: {},
  caseId: string|number
}

export const assignExistingUser = detachedMethodCaller < Action > ({
  actionType: ASSIGN_EXISTING_USER,
  methodName: `${collectionName}.changeAssignee`,
  argTranslator: ({ user, caseId }) => [user, parseInt(caseId)]
})
