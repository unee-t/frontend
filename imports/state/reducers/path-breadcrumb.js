import { STORE_BREADCRUMB } from '../../ui/general-actions'

export default function (state = '', action) {
  switch (action.type) {
    case STORE_BREADCRUMB:
      return action.path
    default:
      return state
  }
}
