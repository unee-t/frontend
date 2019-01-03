export const UPDATE_SEARCH_RESULT = 'update_search_result'
export const FINISH_SEARCH = 'finish_search'
export const START_SEARCH = 'start_search'

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
