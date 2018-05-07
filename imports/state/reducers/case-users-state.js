import {
  ROLE_USERS_ADDED,
  ROLE_USERS_STATE_ERROR,
  CLEAR_ROLE_USERS_STATE,
  ROLE_USERS_REMOVED
} from '../../ui/case/case.actions'

export default function caseUsersState (state = {}, { type, users, caseId, error }) {
  switch (type) {
    case ROLE_USERS_ADDED:
      return {
        added: users,
        caseId
      }
    case ROLE_USERS_REMOVED:
      return {
        removed: users,
        caseId
      }
    case CLEAR_ROLE_USERS_STATE:
      return {}
    case ROLE_USERS_STATE_ERROR:
      return {
        error: error,
        users,
        caseId
      }
    default:
      return state
  }
}
