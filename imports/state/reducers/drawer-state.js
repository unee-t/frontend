import { SET_DRAWER_STATE } from '../../ui/general-actions'

export default function (state = { isOpen: false }, action) {
  switch (action.type) {
    case SET_DRAWER_STATE:
      return Object.assign({}, state, { isOpen: action.isOpen })
    default:
      return state
  }
}
