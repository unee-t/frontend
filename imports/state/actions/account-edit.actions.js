// @flow
export const EDIT_PROFILE_FIELD = 'edit_user_account_profile_field'

export function editProfileField (fieldName: string, fieldValue: string) {
  return {
    type: EDIT_PROFILE_FIELD,
    fieldName,
    fieldValue
  }
}
