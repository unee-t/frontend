// @flow
import fallibleMethodCaller from './base/fallible-method-caller'
import {
  RESET_REPORTS_LOGO,
  resetReportsLogoStarted,
  resetReportsLogoCompleted,
} from '../actions/report-settings.actions'
import { genericErrorOccurred } from '../../ui/general-actions'

export const resetLogoUrl = fallibleMethodCaller({
  actionType: RESET_REPORTS_LOGO,
  methodName: `users.resetReportsLogo`,
  argTranslator: () => [],
  actionGenerators: {
    initGen: () => resetReportsLogoStarted(),
    errorGen: err => genericErrorOccurred(`Failed to reset custom logo setting due to: "${err.error}"`),
    successGen: () => resetReportsLogoCompleted()
  }
})
