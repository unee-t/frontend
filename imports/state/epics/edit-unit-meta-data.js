// @flow
import { collectionName } from '../../api/unit-meta-data'
import { detachedMethodCaller } from './base/detached-method-caller'
import { EDIT_UNIT_META_DATA } from '../actions/unit-meta-data.actions'

import type { EditUnitMetaDataAction } from '../actions/unit-meta-data.actions'

export const editUnitMetaData = detachedMethodCaller < EditUnitMetaDataAction > ({
  actionType: EDIT_UNIT_META_DATA,
  methodName: `${collectionName}.update`,
  argTranslator: ({ unitId, fields }) => [unitId, fields]
})
