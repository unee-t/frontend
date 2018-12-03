// @flow
import { detachedMethodCaller } from './base/detached-method-caller'
import { EDIT_PROFILE_FIELD } from '../actions/account-edit.actions'

type Action = {
  type: string,
  fieldName: string,
  fieldValue: string
}
export const editProfileField = detachedMethodCaller < Action > ({
  actionType: EDIT_PROFILE_FIELD,
  methodName: 'users.updateProfileField',
  argTranslator: ({ fieldName, fieldValue }) => [ fieldName, fieldValue ]
})
