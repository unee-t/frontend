export const RESEND_VERIFICATION = 'resend_verification'
export const RESEND_ERROR = 'resend_verification_error'
export const RESEND_SUCCESS = 'resend_verification_success'

export function resendVerification () {
  return {
    type: RESEND_VERIFICATION
  }
}
