import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import { Meteor } from 'meteor/meteor'
import { resendVerification } from './unverified-warning.actions'

class UnverifiedWarning extends React.Component {
  handleResendClicked = () => {
    const { dispatch, email } = this.props
    dispatch(resendVerification(email))
  }

  render () {
    const { isUserVerified, email, resendSuccess } = this.props
    const notification = resendSuccess ? ' The email has been sent.' : 'Resend Email Verification'
    return !isUserVerified ? (
      <div className='bg-warn-pale-red card-shadow-1 tc pv2 warn-plain-red f7'>
        <div className='mb0 mt2'>
          <span className='fw6'>Your email address {email} has not been verified yet. </span>
           Please check your email for the verification email.
        </div>
        <div className={'mt2 ' + (!resendSuccess ? 'underline' : '')}
          onClick={() => this.handleResendClicked()}>
          {notification}
        </div>
      </div>
    ) : null
  }
}

UnverifiedWarning.propTypes = {
  isUserVerified: PropTypes.bool.isRequired,
  email: PropTypes.string.isRequired,
  resendSuccess: PropTypes.bool

}

export default connect(
  ({ resendVerificationState }) => ({
    resendSuccess: resendVerificationState.resendSuccess
  }) // Redux store to props
)(createContainer(
  () => {
    return {
      isUserVerified: Meteor.user() ? Meteor.user().emails[0].verified : true,
      email: Meteor.user() ? Meteor.user().emails[0].address : ''
    }
  }, // Meteor data to props
  UnverifiedWarning
))
