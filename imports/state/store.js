import { applyMiddleware, createStore, compose } from 'redux'
import { createLogger } from 'redux-logger'
import ReduxThunk from 'redux-thunk'
import rootReducer from './root-reducer'
import createHistory from 'history/createBrowserHistory'
import { routerMiddleware } from 'react-router-redux'
import { createEpicMiddleware } from 'redux-observable'
import { ajax } from 'rxjs/observable/dom/ajax'
import { rootEpic } from './root-epic'
// import DevTools from '../../../imports/client/components/DevTools'

const logger = createLogger()
export const history = createHistory()
const router = routerMiddleware(history)
const epicMiddleware = createEpicMiddleware(rootEpic, {
  dependencies: {
    ajax
  }
})

const enhancers = [
  applyMiddleware(ReduxThunk, epicMiddleware, logger, router)
  // DevTools.instrument()
]

export const Store = createStore(rootReducer, {}, compose(...enhancers))
