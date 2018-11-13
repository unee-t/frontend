import { Meteor } from 'meteor/meteor'
import { SETTING_CHANGED } from '../../ui/notification-settings/notification-settings.actions'

import 'rxjs/add/operator/do'
import 'rxjs/add/operator/ignoreElements'

export const changeNotificationSetting = action$ =>
  action$.ofType(SETTING_CHANGED)
    .filter(() => !!Meteor.userId()) // fail safe, but shouldn't happen
    .do(({ settingName, newVal }) => {
      Meteor.call('users.updateNotificationSetting', settingName, newVal)
    })
    .ignoreElements()
