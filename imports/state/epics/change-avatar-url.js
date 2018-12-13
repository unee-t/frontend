// @flow
import fallibleMethodCaller from './base/fallible-method-caller'
import {
  CHANGE_AVATAR_URL,
  changeAvatarUrlError,
  changeAvatarUrlCompleted
} from '../actions/account-edit.actions'

export const changeAvatarUrl = fallibleMethodCaller({
  actionType: CHANGE_AVATAR_URL,
  methodName: 'users.changeAvatarImage',
  argTranslator: ({ url }) => [url],
  actionGenerators: {
    errorGen: error => changeAvatarUrlError(error),
    successGen: () => changeAvatarUrlCompleted()
  }
})
