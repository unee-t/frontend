export const RESET_PASS = 'reset_pass'
export const RESET_PASS_COMPLETE = 'reset_pass_complete'
export const RESET_PASS_ERROR = 'reset_pass_error'

export function resetPass (newPass) {
  return {
    type: RESET_PASS,
    newPass
  }
}
