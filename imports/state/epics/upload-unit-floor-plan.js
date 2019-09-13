// @flow
import { fileUploadProcessor } from './base/file-upload-processor'
import {
  changeFloorPlanUrl,
  UPLOAD_FLOOR_PLAN, uploadFloorPlanCompleted,
  uploadFloorPlanError,
  uploadFloorPlanProgress,
  uploadFloorPlanStarted
} from '../actions/unit-floor-plan.actions'

import type { UnitFloorPlanInitAction } from '../actions/unit-floor-plan.actions'

export const uploadUnitFloorPlan = fileUploadProcessor < UnitFloorPlanInitAction > (UPLOAD_FLOOR_PLAN, {
  init: action => uploadFloorPlanStarted(action.unitMongoId, action.preview, action.file, action.dimensions),
  progress: (action, percent) => uploadFloorPlanProgress(action.unitMongoId, percent),
  error: (action, error) => uploadFloorPlanError(action.unitMongoId, error),
  complete: (action, url) => [
    uploadFloorPlanCompleted(action.unitMongoId),
    changeFloorPlanUrl(action.unitMongoId, url, action.dimensions)
  ]
})
