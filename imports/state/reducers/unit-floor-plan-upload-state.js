// @flow
import type { UnitFloorPlanProcessAction } from '../actions/unit-floor-plan.actions'
import {
  UPLOAD_FLOOR_PLAN_COMPLETED,
  UPLOAD_FLOOR_PLAN_ERROR,
  UPLOAD_FLOOR_PLAN_PROGRESS,
  UPLOAD_FLOOR_PLAN_STARTED
} from '../actions/unit-floor-plan.actions'

type Process = {
  unitMongoId: string,
  preview: string,
  percent: number,
  error?: {}
}

type State = Array<Process>

export default function (state: State = [], action: UnitFloorPlanProcessAction): State {
  let newState, processIndex
  const procPredicate = proc => proc.unitMongoId === action.unitMongoId
  switch (action.type) {
    case UPLOAD_FLOOR_PLAN_STARTED:
      newState = state.slice()
      processIndex = newState.findIndex(procPredicate)
      const newProcess = {
        unitMongoId: action.unitMongoId,
        percent: 0,
        preview: action.preview || ''
      }
      if (processIndex === -1) {
        newState.push(newProcess)
      } else {
        newState.splice(processIndex, 1, newProcess)
      }
      return newState
    case UPLOAD_FLOOR_PLAN_PROGRESS:
      newState = state.slice()
      processIndex = newState.findIndex(procPredicate)
      newState.splice(processIndex, 1, {
        ...newState[processIndex],
        percent: action.percent
      })
      return newState
    case UPLOAD_FLOOR_PLAN_ERROR:
      newState = state.slice()
      processIndex = newState.findIndex(procPredicate)
      newState.splice(processIndex, 1, {
        ...newState[processIndex],
        error: action.error
      })
      return newState
    case UPLOAD_FLOOR_PLAN_COMPLETED:
      newState = state.slice()
      processIndex = newState.findIndex(procPredicate)
      newState.splice(processIndex, 1)
      return newState
  }

  return state
}
