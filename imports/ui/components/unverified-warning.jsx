import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import { Meteor } from 'meteor/meteor'

class UnverifiedWarning extends React.Component {
  render () {
    const { isUserVerified, email } = this.props
    return !isUserVerified ? (
      <div className='bg-warn-pale-red card-shadow-1 tc pt2 pb3 warn-plain-red'>
        <div className='f6 fw5'>Verify your email address</div>
        <p className='f7 mb0 mt2'>
          Your email address {email} has not been verified yet.
          Confirm your email to receive updates on your cases.
          <a>Resend email verification</a>.
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
  () => ({}) // Redux store to props
)(createContainer(
  () => {
    return {
      isUserVerified: Meteor.user() ? Meteor.user().emails[0].verified : true,
      email: Meteor.user() ? Meteor.user().emails[0].address : ''
    }
  }, // Meteor data to props
  UnverifiedWarning
))
