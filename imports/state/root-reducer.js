import { combineReducers } from 'redux'
import { routerReducer as router } from 'react-router-redux'
import hideCompleted from './reducers/hide-completed'
import showLoginError from './reducers/show-login-error'
import caseAttachmentUploads from './reducers/case-attachment-uploads'

const rootReducer = combineReducers({
  hideCompleted,
  showLoginError,
  caseAttachmentUploads,
  router
})

export default rootReducer
