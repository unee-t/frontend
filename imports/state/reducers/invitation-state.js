import {
  INVITATION_INITIATED,
  INVITATION_ERROR,
  INVITATION_SUCCESS,
  INVITATION_CLEARED
} from '../../ui/case/case.actions'

export default function (state = {}, { type, caseId, email, errorText }) {
  switch (type) {
    case INVITATION_CLEARED:
      return {}
    case INVITATION_INITIATED:
    case INVITATION_ERROR:
      return { caseId, email, errorText, loading: true }
    case INVITATION_SUCCESS:
      return { caseId, email, completed: true }
  }
  return state
}
