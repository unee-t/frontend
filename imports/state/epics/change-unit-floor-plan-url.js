// @flow
import fallibleMethodCaller from './base/fallible-method-caller'
import { CHANGE_FLOOR_PLAN_URL } from '../actions/unit-floor-plan.actions'
import { collectionName } from '../../api/unit-meta-data'
import { genericErrorOccurred } from '../../ui/general-actions'

export const changeUnitFloorPlanUrl = fallibleMethodCaller({
  actionType: CHANGE_FLOOR_PLAN_URL,
  methodName: `${collectionName}.updateFloorPlan`,
  argTranslator: ({ unitMongoId, url, dimensions }) => [unitMongoId, url, dimensions],
  actionGenerators: {
    errorGen: (error, action) => genericErrorOccurred(
      `Error occurred while trying to update the floor plan URL for unit ${action.unitMongoId}: ${error.message}`
    )
  }
})
