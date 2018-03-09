export const FORGOT_PASS = 'forgot_pass'
export const ERROR = 'forgot_pass_error'
export const RESET_ERROR = 'forgot_pass_reset_error'
export const SUCCESS = 'forgot_pass_success'
export const SUCCESS_CLEAR = 'forgot_pass_success_clear'

export function forgotPass (email) {
  return {
    type: FORGOT_PASS,
    email
  }
}

export function resetError () {
  return {
    type: RESET_ERROR
  }
}

export function successClear () {
  return {
    type: SUCCESS_CLEAR
  }
}
