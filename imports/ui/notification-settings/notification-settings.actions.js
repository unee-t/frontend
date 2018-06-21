export const SETTING_CHANGED = 'notification_setting_changed'

export function settingChanged (settingName, newVal) {
  return {
    type: SETTING_CHANGED,
    settingName,
    newVal
  }
}
