export const LOGOUT_USER = 'logout_user'
export const SET_DRAWER_STATE = 'set_drawer_state'
export const STORE_BREADCRUMB = 'store_breadcrumb'
export const GENERIC_ERROR_OCCURRED = 'generic_error_occurred'
export const GENERIC_ERROR_CLEARED = 'generic_error_cleared'

export function logoutUser () {
  return {
    type: LOGOUT_USER
  }
}

export function setDrawerState (isOpen) {
  return {
    type: SET_DRAWER_STATE,
    isOpen
  }
}

export function storeBreadcrumb (path) {
  return {
    type: STORE_BREADCRUMB,
    path
  }
}

export function genericErrorOccurred (errorText) {
  return {
    type: GENERIC_ERROR_OCCURRED,
    errorText
  }
}

export function genericErrorCleared (errorIdx) {
  return {
    type: GENERIC_ERROR_CLEARED,
    errorIdx
  }
}
