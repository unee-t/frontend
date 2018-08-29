import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import { Meteor } from 'meteor/meteor'
import { resendVerification } from './unverified-warning.actions'

class UnverifiedWarning extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      resendStatus: 'Resend Email Verification'
    }
  }

  handleResendClicked = () => {
    const { userId, dispatch, resendSuccess } = this.props
    dispatch(resendVerification(userId))

    if (resendSuccess) {
      this.setState({
        resendStatus: 'Email has been sent.'
      })
    }
  }

  render () {
    const { isUserVerified, email } = this.props
    const { resendStatus } = this.state
    return !isUserVerified ? (
      <div className='bg-warn-pale-red card-shadow-1 tc pt2 pb3 warn-plain-red'>
        <div className='f6 fw5'>Verify your email address</div>
        <p className='f7 mb0 mt2'>
          Your email address {email} has not been verified yet.
          Confirm your email to receive updates on your cases.
          <div onClick={() => this.handleResendClicked()}>
            { resendStatus }
          </div>
        </p>
      </div>
    ) : null
  }
}

UnverifiedWarning.propTypes = {
  isUserVerified: PropTypes.bool.isRequired,
  email: PropTypes.string.isRequired

}

export default connect(
  (resendVerificationState) => ({
    resendSuccess: resendVerificationState.resendSuccess,
    resendError: resendVerificationState.error
  }) // Redux store to props
)(createContainer(
  () => {
    return {
      isUserVerified: Meteor.user() ? Meteor.user().emails[0].verified : true,
      email: Meteor.user() ? Meteor.user().emails[0].address : '',
      userId: Meteor.userId()
    }
  }, // Meteor data to props
  UnverifiedWarning
))
