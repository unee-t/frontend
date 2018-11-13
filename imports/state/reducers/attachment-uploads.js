import _ from 'lodash'
import {
  ATTACHMENT_UPLOAD_COMPLETED as COMPLETED,
  ATTACHMENT_UPLOAD_ERROR as ERROR,
  ATTACHMENT_UPLOAD_PROGRESS as PROGRESS,
  ATTACHMENT_UPLOADING as UPLOADING
} from '../../ui/case/case.actions'

const actionTypes = [COMPLETED, ERROR, PROGRESS, UPLOADING]

export default function attachmentUploads (state = {}, action) {
  if (actionTypes.includes(action.type)) {
    const { caseId, processId, preview, percent, file } = action
    const idStr = caseId.toString()
    const newState = Object.assign({}, state)
    newState[idStr] = (() => {
      switch (action.type) {
        case UPLOADING: // Creating a new process descriptor and appending to this case's list
          const newProc = { processId, preview, file, caseId }
          return state[idStr] ? state[idStr].concat([newProc]) : [newProc]
        case PROGRESS:
        case ERROR: // Both actions' parsing involve modifying an existing process descriptor
          return !state[idStr] ? null : state[idStr].map(proc => proc.processId === processId // Match by "processId"
            ? (
              action.type === PROGRESS
                // For PROGRESS, modify "percent" from the action
                ? Object.assign({}, proc, { percent })
                // For ERROR, remove "percent" and add error related info from the action
                : Object.assign({}, proc, { percent: undefined }, _.pick(action, 'error', 'errorMessage'))
            ) : proc
          )
        case COMPLETED: // Removing the process descriptor from this case's list once its completed
          return !state[idStr] ? null : state[idStr].filter(proc => proc.processId !== processId)
      }
    })()
    return newState
  }
  return state
}
