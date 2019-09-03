// @flow
/* global File */
export const UPLOAD_FLOOR_PLAN = 'upload_unit_floor_plan'
export const UPLOAD_FLOOR_PLAN_STARTED = 'upload_unit_floor_plan_started'
export const UPLOAD_FLOOR_PLAN_PROGRESS = 'upload_unit_floor_plan_progress'
export const UPLOAD_FLOOR_PLAN_ERROR = 'upload_unit_floor_plan_error'
export const UPLOAD_FLOOR_PLAN_COMPLETED = 'upload_unit_floor_plan_completed'
export const CHANGE_FLOOR_PLAN_URL = 'change_unit_floor_plan_url'
export const DISABLE_FLOOR_PLAN = 'disable_unit_floor_plan'

export type UnitFloorPlanInitAction = {
  type: string,
  preview: string,
  file: File,
  unitMongoId: string
}

export type UnitFloorPlanProcessAction = {
  type: string,
  unitMongoId: string,
  file?: File,
  preview?: string,
  percent?: number,
  error?: {}
}

export type UnitFloorPlanCompleteAction = {
  type: string,
  unitMongoId: string,
  url: string
}

export type UnitFloorPlanDisableAction = {
  type: string,
  unitMongoId: string
}

export function uploadFloorPlan (unitMongoId: string, preview: string, file: File): UnitFloorPlanInitAction {
  return {
    type: UPLOAD_FLOOR_PLAN,
    unitMongoId,
    preview,
    file
  }
}

export function uploadFloorPlanStarted (unitMongoId: string, preview: string, file: File): UnitFloorPlanProcessAction {
  return {
    type: UPLOAD_FLOOR_PLAN_STARTED,
    unitMongoId,
    preview,
    file
  }
}

export function uploadFloorPlanProgress (unitMongoId: string, percent: number): UnitFloorPlanProcessAction {
  return {
    type: UPLOAD_FLOOR_PLAN_PROGRESS,
    unitMongoId,
    percent
  }
}

export function uploadFloorPlanError (unitMongoId: string, error: {}): UnitFloorPlanProcessAction {
  return {
    type: UPLOAD_FLOOR_PLAN_ERROR,
    unitMongoId,
    error
  }
}

export function uploadFloorPlanCompleted (unitMongoId: string): UnitFloorPlanProcessAction {
  return {
    type: UPLOAD_FLOOR_PLAN_COMPLETED,
    unitMongoId
  }
}

export function changeFloorPlanUrl (unitMongoId: string, url: string): UnitFloorPlanCompleteAction {
  return {
    type: CHANGE_FLOOR_PLAN_URL,
    unitMongoId,
    url
  }
}

export function disableFloorPlan (unitMongoId: string): UnitFloorPlanDisableAction {
  return {
    type: DISABLE_FLOOR_PLAN,
    unitMongoId
  }
}
