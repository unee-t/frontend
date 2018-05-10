export const LOGOUT_USER = 'logout_user'
export const SET_DRAWER_STATE = 'set_drawer_state'

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
