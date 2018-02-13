import { combineReducers } from 'redux'
import { routerReducer as router } from 'react-router-redux'
import hideCompleted from './reducers/hide-completed'
import showLoginError from './reducers/show-login-error'
import caseAttachmentUploads from './reducers/case-attachment-uploads'
import invitationState from './reducers/invitation-state'
import caseCreationState from './reducers/case-creation-state'
import invitationLoginState from './reducers/invitation-login-state'

const rootReducer = combineReducers({
  hideCompleted,
  showLoginError,
  caseAttachmentUploads,
  invitationState,
  caseCreationState,
  invitationLoginState,
  router
})

export default rootReducer
