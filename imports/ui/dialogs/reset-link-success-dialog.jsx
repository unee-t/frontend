import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Dialog from 'material-ui/Dialog'
import RaisedButton from 'material-ui/RaisedButton'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import FontIcon from 'material-ui/FontIcon'

import { successClear } from '../forgot-pass/forgot-pass.actions'
import {closeDialogButtonStyle} from './generic-dialog.mui-styles'

class ResetLinkSuccessDialog extends Component {
  handleDismiss = () => {
    this.props.dispatch(successClear())
  }
  render () {
    const { isShown, email } = this.props
    return (
      <Dialog
        open={isShown}
        modal
      >
        <button className='button b--none bg-transparent absolute top-1 pt2 right-1 outline-0'
          onClick={this.handleDismiss}
        >
          <FontIcon className='material-icons' style={closeDialogButtonStyle}>close</FontIcon>
        </button>
        <div className='tc'>
          <FontIcon className='material-icons' color='var(--success-green)' style={{fontSize: '80px'}}>
            check_circle
          </FontIcon>
          <p className='mv0'>We just sent a password reset link to&nbsp;
            <span className='fw5'>
              {email}
            </span>
            <br />
            Please check your inbox for further instructions.
          </p>
          <div className='mt2'>
            <RaisedButton label='Ok' labelColor='white' backgroundColor='var(--bondi-blue)'
              onClick={this.handleDismiss}
            />
          </div>
        </div>
      </Dialog>
    )
  }
}

ResetLinkSuccessDialog.propTypes = {
  isShown: PropTypes.bool.isRequired,
  email: PropTypes.string
}

export default connect(
  ({ sendResetLinkState }) => ({
    isShown: !!sendResetLinkState.successfulEmail,
    email: sendResetLinkState.successfulEmail
  }) // map redux state to props
)(createContainer(() => ({ // map meteor state to props
}), ResetLinkSuccessDialog))
