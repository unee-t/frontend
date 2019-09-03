// @flow

import { detachedMethodCaller } from './base/detached-method-caller'
import { DISABLE_FLOOR_PLAN } from '../actions/unit-floor-plan.actions'
import { collectionName } from '../../api/unit-meta-data'

type Action = {
  type: string,
  unitMongoId: string
}

export const disableUnitFloorPlan = detachedMethodCaller < Action > ({
  actionType: DISABLE_FLOOR_PLAN,
  methodName: `${collectionName}.disableFloorPlan`,
  argTranslator: ({ unitMongoId }) => [unitMongoId]
})
