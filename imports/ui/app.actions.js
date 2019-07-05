export const CHECK_PASS_RESET = 'check_pass_reset'
export const PASS_RESET_REQUESTED = 'pass_reset_requested'
export const LOGIN_WITH_OTP = 'login_with_otp'

export function checkPassReset () {
  return {
    type: CHECK_PASS_RESET
  }
}

export function loginWithOtp (userId, otpToken) {
  return {
    type: LOGIN_WITH_OTP,
    userId,
    otpToken
  }
}
