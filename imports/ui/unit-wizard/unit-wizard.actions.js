export const CREATE_UNIT = 'create_unit_from_form'
export const CREATE_UNIT_ERROR = 'create_unit_from_form_error'
export const CREATE_UNIT_CLEAR_ERROR = 'create_unit_from_form_clear_error'
export const CREATE_UNIT_SUCCESS = 'create_unit_from_form_success'
export const CREATE_UNIT_INITIATED = 'create_unit_from_form_initiated'

export function createUnit (creationArgs) {
  return {
    type: CREATE_UNIT,
    creationArgs
  }
}

export function clearError () {
  return {
    type: CREATE_UNIT_CLEAR_ERROR
  }
}
