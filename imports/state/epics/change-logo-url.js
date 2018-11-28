// @flow
import fallibleMethodCaller from './base/fallible-method-caller'
import {
  CHANGE_LOGO_URL,
  changeLogoUrlStarted,
  changeLogoUrlError,
  changeLogoUrlCompleted
} from '../actions/report-settings.actions'

export const changeLogoUrl = fallibleMethodCaller({
  actionType: CHANGE_LOGO_URL,
  methodName: `users.changeReportsLogo`,
  argTranslator: ({ url }) => [url],
  actionGenerators: {
    initGen: () => changeLogoUrlStarted(),
    errorGen: err => changeLogoUrlError(err),
    successGen: () => changeLogoUrlCompleted()
  }
})
