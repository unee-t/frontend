// @flow
export const EDIT_UNIT_META_DATA = 'edit_unit_meta_data'

export type EditUnitMetaDataAction = {
  type: string,
  unitId: string,
  fields: Object
}

export function editUnitMetaData (unitId: string, fields: Object): EditUnitMetaDataAction {
  return {
    type: EDIT_UNIT_META_DATA,
    unitId,
    fields
  }
}
