import { combineReducers } from 'redux'
import hideCompleted from './reducers/hide-completed'

const rootReducer = combineReducers({
	hideCompleted,
})

export default rootReducer