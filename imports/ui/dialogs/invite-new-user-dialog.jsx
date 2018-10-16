import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Dialog from 'material-ui/Dialog'
import IconButton from 'material-ui/IconButton'
import FontIcon from 'material-ui/FontIcon'
import TextField from 'material-ui/TextField'
import RaisedButton from 'material-ui/RaisedButton'

import EmailInput from '../components/email-input'
import UnitRoleSelect from '../components/unit-role-select'

import {
  modalTitleStyle,
  closeDialogButtonStyle,
  modalBodyStyle,
  modalCustomContentStyle
} from './generic-dialog.mui-styles'

import {
  textInputStyle,
  textInputUnderlineFocusStyle
} from '../components/form-controls.mui-styles'

class InviteNewUserDialog extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      inviteeEmail: '',
      inviteeRole: null,
      firstName: '',
      lastName: '',
      isOccupant: false,
      showRoleRequired: false
    }
  }
  handleSubmit = evt => {
    evt.preventDefault()
    const { inviteeRole, firstName, lastName, inviteeEmail, isOccupant } = this.state
    if (!inviteeRole) {
      this.setState({
        showRoleRequired: true
      })
    } else {
      this.props.onSubmitted({
        firstName,
        lastName,
        inviteeEmail,
        inviteeRole,
        isOccupant
      })
    }
  }
  render () {
    const { onCloseRequested, currentInvitees, onSubmitted, ...rest } = this.props
    const { inviteeEmail, inviteeRole, isOccupant, showRoleRequired, firstName, lastName } = this.state
    return (
      <Dialog
        titleStyle={modalTitleStyle}
        bodyStyle={modalBodyStyle}
        contentStyle={modalCustomContentStyle}
        {...rest}
      >
        <div className='absolute top-0 pt2 pr2 right-0'>
          <IconButton onClick={onCloseRequested}>
            <FontIcon className='material-icons' style={closeDialogButtonStyle}>close</FontIcon>
          </IconButton>
        </div>
        <form onSubmit={this.handleSubmit}>
          <div className='flex'>
            <div>
              <TextField
                floatingLabelText='First Name*'
                value={firstName}
                onChange={evt => this.setState({firstName: evt.target.value})}
                fullWidth
                required
                inputStyle={textInputStyle}
                underlineFocusStyle={textInputUnderlineFocusStyle}
              />
            </div>
            <div className='ml3'>
              <TextField
                floatingLabelText='Last Name*'
                value={lastName}
                onChange={evt => this.setState({lastName: evt.target.value})}
                fullWidth
                required
                inputStyle={textInputStyle}
                underlineFocusStyle={textInputUnderlineFocusStyle}
              />
            </div>
          </div>
          <EmailInput
            label='Email Address'
            email={inviteeEmail}
            invalidEmails={currentInvitees ? currentInvitees.map(i => i.email) : null}
            invalidReasonMessage='This email belongs to a user who is already invited'
            onEmailChanged={email => this.setState({inviteeEmail: email})}
          />
          <UnitRoleSelect
            isOccupant={isOccupant}
            selectedRole={inviteeRole}
            onRoleSelected={role => this.setState({inviteeRole: role, showRoleRequired: false})}
            onOccupantToggled={isIt => this.setState({isOccupant: isIt})}
            showRequired={showRoleRequired}
          />
          <div className='flex justify-end mt3'>
            <RaisedButton primary type='submit'>
              <span className='white fw6'>Next</span>
            </RaisedButton>
          </div>
        </form>
      </Dialog>
    )
  }
}

InviteNewUserDialog.propTypes = {
  onCloseRequested: PropTypes.func.isRequired,
  onSubmitted: PropTypes.func.isRequired,
  currentInvitees: PropTypes.array
}

export default InviteNewUserDialog
