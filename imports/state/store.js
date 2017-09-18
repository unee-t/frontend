import { applyMiddleware, createStore, compose } from 'redux'
import { createLogger } from 'redux-logger'
import ReduxThunk from 'redux-thunk'
import rootReducer from './root-reducer'
import createHistory from 'history/createBrowserHistory'
import { routerMiddleware } from 'react-router-redux'
// import DevTools from '../../../imports/client/components/DevTools'

const logger = createLogger()
export const history = createHistory()
const router = routerMiddleware(history)

const enhancers = [
  applyMiddleware(ReduxThunk, logger, router)
  // DevTools.instrument()
]

export const Store = createStore(rootReducer, {}, compose(...enhancers))
