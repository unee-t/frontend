export const RESEND_VERIFICATION = 'resend_verification'
export const ERROR = 'resend_verification_error'
export const SUCCESS = 'resend_verification_success'

export function resendVerification (userId) {
  return {
    type: RESEND_VERIFICATION,
    userId
  }
}
