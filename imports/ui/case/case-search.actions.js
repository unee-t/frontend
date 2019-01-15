export const UPDATE_SEARCH_RESULT = 'update_search_result'
export const FINISH_SEARCH = 'finish_search'
export const START_SEARCH = 'start_search'
export const NAVIGATION_REQUESTED = 'navigation_requested'
export const NAVIGATION_GRANTED = 'navigation_granted'

export function updateSearch (searchText) {
  return {
    type: UPDATE_SEARCH_RESULT,
    searchText: searchText
  }
}

export function finishSearch () {
  return {
    type: FINISH_SEARCH,
    searchFinished: true
  }
}

export function startSearch () {
  return {
    type: START_SEARCH,
    searchFinished: false
  }
}

export function navigationRequested () {
  return {
    type: NAVIGATION_REQUESTED
  }
}

export function navigationGranted () {
  return {
    type: NAVIGATION_GRANTED
  }
}
