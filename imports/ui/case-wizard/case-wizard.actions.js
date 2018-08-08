export const CREATE_CASE = 'create_case'
export const CREATE_CASE_INITIATED = 'create_case_initiated'
export const CREATE_CASE_ERROR = 'create_case_error'
export const CREATE_CASE_SUCCESS = 'create_case_success'
export const CREATE_CASE_CLEAR_ERROR = 'create_case_clear_error'

export function createCase (params, newUserEmail, newUserIsOccupant, parentReport) {
  return {
    type: CREATE_CASE,
    params,
    newUserEmail,
    newUserIsOccupant,
    parentReport
  }
}

export function clearError () {
  return {
    type: CREATE_CASE_CLEAR_ERROR
  }
}
