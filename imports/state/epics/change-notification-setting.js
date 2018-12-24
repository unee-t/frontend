// @flow
import { detachedMethodCaller } from './base/detached-method-caller'
import { SETTING_CHANGED } from '../../ui/notification-settings/notification-settings.actions'

type Action = {
  type: string,
  settingName: string,
  newVal: boolean
}
export const changeNotificationSetting = detachedMethodCaller < Action > ({
  actionType: SETTING_CHANGED,
  methodName: 'users.updateNotificationSetting',
  argTranslator: ({ settingName, newVal }) => [settingName, newVal]
})
