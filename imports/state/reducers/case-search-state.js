import {
  UPDATE_SEARCH_RESULT,
  SEARCH_ERROR,
  FINISH_SEARCH,
  START_SEARCH,
  NAVIGATION_REQUESTED,
  NAVIGATION_GRANTED
} from '../../ui/case/case-search.actions'

const initialState = { searchText: '', searchActive: false, navigationRequested: false }
export default function caseSearchState (state = initialState, action) {
  switch (action.type) {
    case SEARCH_ERROR:
      return action.value.error.message || action.value.message
    case UPDATE_SEARCH_RESULT:
      return Object.assign({}, state, { searchText: action.searchText, navigationRequested: false })
    case FINISH_SEARCH:
      return Object.assign({}, state, { searchActive: false, navigationRequested: false })
    case START_SEARCH:
      return Object.assign({}, state, { searchActive: true, navigationRequested: false })
    case NAVIGATION_REQUESTED:
      return Object.assign({}, state, { navigationRequested: true })
    case NAVIGATION_GRANTED:
      return Object.assign({}, state, { navigationRequested: false })
  }
  return state
}
