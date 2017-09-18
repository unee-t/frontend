import { combineReducers } from 'redux'
import { routerReducer as router } from 'react-router-redux'
import hideCompleted from './reducers/hide-completed'
import showLoginError from './reducers/showLoginError'

const rootReducer = combineReducers({
  hideCompleted,
  showLoginError,
  router
})

export default rootReducer
