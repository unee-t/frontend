import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Dialog from 'material-ui/Dialog'
import IconButton from 'material-ui/IconButton'
import FontIcon from 'material-ui/FontIcon'
import TextField from 'material-ui/TextField'
import RaisedButton from 'material-ui/RaisedButton'
import CircularProgress from 'material-ui/CircularProgress'
import { CSSTransition } from 'react-transition-group'

import EmailInput from '../components/email-input'
import UnitRoleSelect from '../components/unit-role-select'
import ErrorDialog from './error-dialog'

import {
  modalTitleStyle,
  closeDialogButtonStyle,
  modalBodyStyle,
  modalCustomContentStyle,
  inviteSuccessIconStyle
} from './generic-dialog.mui-styles'

import {
  textInputStyle,
  textInputUnderlineFocusStyle
} from '../components/form-controls.mui-styles'

class InviteNewUserDialog extends Component {
  constructor () {
    super(...arguments)
    this.initialState = {
      inviteeEmail: '',
      inviteeRole: null,
      firstName: '',
      lastName: '',
      isOccupant: false,
      showRoleRequired: false
    }
    this.state = {
      ...this.initialState
    }
  }
  getCurrentInviteObject (activeInvites) {
    return activeInvites.find(i => i.userEmail === this.state.inviteeEmail)
  }
  getCurrentStateType (currentInviteObject) {
    if (!currentInviteObject) return 'idle'
    if (currentInviteObject.pending) return 'pending'
    if (currentInviteObject.completed) return 'completed'
    if (currentInviteObject.error) return 'error'
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
  componentDidUpdate (prevProps) {
    const prevStateType = this.getCurrentStateType(this.getCurrentInviteObject(prevProps.activeInvites))
    const currStateType = this.getCurrentStateType(this.getCurrentInviteObject(this.props.activeInvites))
    if (prevStateType !== currStateType && currStateType === 'completed') {
      setTimeout(() => {
        this.props.onCloseRequested()
        setTimeout(() => {
          this.setState({
            ...this.initialState
          })
        }, 300)
      }, 800)
    }
  }
  render () {
    const { onCloseRequested, currentInvitees, onSubmitted, activeInvites, onErrorDismissed, ...rest } = this.props
    const { inviteeEmail, inviteeRole, isOccupant, showRoleRequired, firstName, lastName } = this.state
    const currentInviteObject = this.getCurrentInviteObject(this.props.activeInvites)
    const stateType = this.getCurrentStateType(currentInviteObject)
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
        <form onSubmit={this.handleSubmit} className={stateType !== 'idle' ? 'o-0 disabled' : ''}>
          <div className='flex'>
            <div>
              <TextField
                floatingLabelText='First Name*'
                value={firstName}
                onChange={evt => this.setState({ firstName: evt.target.value })}
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
                onChange={evt => this.setState({ lastName: evt.target.value })}
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
            onEmailChanged={email => this.setState({ inviteeEmail: email })}
          />
          <UnitRoleSelect
            isOccupant={isOccupant}
            selectedRole={inviteeRole}
            onRoleSelected={role => this.setState({ inviteeRole: role, showRoleRequired: false })}
            onOccupantToggled={isIt => this.setState({ isOccupant: isIt })}
            showRequired={showRoleRequired}
          />
          <div className='flex justify-end mt3'>
            <RaisedButton primary type='submit'>
              <span className='white fw6'>Next</span>
            </RaisedButton>
          </div>
        </form>
        <CSSTransition in={stateType === 'pending' || stateType === 'error'} timeout={300} classNames='zoom-effect' unmountOnExit>
          <div className='absolute top-0 bottom-0 right-0 left-0 flex items-center justify-center'>
            <CircularProgress size={80} />
          </div>
        </CSSTransition>
        <CSSTransition in={stateType === 'completed'} timeout={300} classNames='zoom-effect' unmountOnExit>
          <div className='absolute top-0 bottom-0 right-0 left-0 flex items-center justify-center'>
            <FontIcon className='material-icons' style={inviteSuccessIconStyle}>check_circle</FontIcon>
          </div>
        </CSSTransition>
        <ErrorDialog
          show={stateType === 'error'}
          text={currentInviteObject && currentInviteObject.error ? currentInviteObject.error.error : ''}
          onDismissed={() => onErrorDismissed(inviteeEmail)}
        />
      </Dialog>
    )
  }
}

InviteNewUserDialog.propTypes = {
  onCloseRequested: PropTypes.func.isRequired,
  onSubmitted: PropTypes.func.isRequired,
  onErrorDismissed: PropTypes.func.isRequired,
  currentInvitees: PropTypes.array,
  activeInvites: PropTypes.array
}

export default InviteNewUserDialog
