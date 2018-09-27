import { combineReducers } from 'redux'
import { routerReducer as router } from 'react-router-redux'
import showLoginError from './reducers/show-login-error'
import showSignupError from './reducers/show-signup-error'
import attachmentUploads from './reducers/attachment-uploads'
import invitationState from './reducers/invitation-state'
import caseCreationState from './reducers/case-creation-state'
import reportCreationState from './reducers/report-creation-state'
import invitationLoginState from './reducers/invitation-login-state'
import sendResetLinkState from './reducers/send-reset-link-state'
import resendVerificationState from './reducers/resend-verification-state'
import passResetState from './reducers/pass-reset-state'
import caseUsersState from './reducers/case-users-state'
import drawerState from './reducers/drawer-state'
import pathBreadcrumb from './reducers/path-breadcrumb'
import unitCreationState from './reducers/unit-creation-state'
import genericErrorState from './reducers/generic-error-state'
import reportPreviewUrls from './reducers/report-preview-urls'
import reportSharingState from './reducers/report-sharing-state'

const rootReducer = combineReducers({
  showLoginError,
  showSignupError,
  attachmentUploads,
  invitationState,
  caseCreationState,
  invitationLoginState,
  sendResetLinkState,
  resendVerificationState,
  passResetState,
  caseUsersState,
  drawerState,
  pathBreadcrumb,
  unitCreationState,
  reportCreationState,
  genericErrorState,
  reportPreviewUrls,
  reportSharingState,
  router
})

export default rootReducer
