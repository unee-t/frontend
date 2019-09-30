import { collectionName } from '../../api/comments'

import fallibleMethodCaller from './base/fallible-method-caller'
import { genericErrorOccurred } from '../../ui/general-actions'
import { CHANGE_FLOOR_PLAN_PINS } from '../actions/case-floor-plan-pins.actions'

export const changeCaseFloorPlanPins = fallibleMethodCaller({
  actionType: CHANGE_FLOOR_PLAN_PINS,
  methodName: `${collectionName}.insertFloorPlan`,
  argTranslator: ({ caseId, floorPlanPins, floorPlanId }) => [parseInt(caseId), floorPlanPins, floorPlanId],
  actionGenerators: {
    errorGen: (err, { caseId }) => genericErrorOccurred(
      `Failed to update case's floor plan pins for case ${caseId} due to: "${err.error}"`
    )
  }
})
