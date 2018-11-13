import {
  INVITE_STARTED,
  INVITE_SUCCESS,
  INVITE_ERROR,
  INVITE_CLEARED
} from '../actions/unit-invite.actions'

const processMatcher = (userEmail, unitBzId) => obj => obj.userEmail === userEmail && obj.unitBzId === unitBzId

export default function (state = [], { type, userEmail, unitBzId, error }) {
  let newState, processIndex
  switch (type) {
    case INVITE_STARTED:
    case INVITE_ERROR:
    case INVITE_SUCCESS:
    case INVITE_CLEARED:
      newState = state.slice()
      processIndex = state.findIndex(processMatcher(userEmail, unitBzId))
  }
  switch (type) {
    case INVITE_STARTED:
      const newProcess = { userEmail, unitBzId, pending: true }
      if (processIndex === -1) {
        newState.push(newProcess)
      } else {
        newState.splice(processIndex, 1, newProcess)
      }
      return newState
    case INVITE_SUCCESS:
      newState.splice(processIndex, 1, { userEmail, unitBzId, completed: true })
      return newState
    case INVITE_ERROR:
      newState.splice(processIndex, 1, { userEmail, unitBzId, error })
      return newState
    case INVITE_CLEARED:
      newState.splice(processIndex, 1)
      return newState
  }
  return state
}
