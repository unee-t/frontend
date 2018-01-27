import React, {Component} from 'react'
import {Link, Route} from 'react-router-dom'
import PropTypes from 'prop-types'
import Dialog from 'material-ui/Dialog'
import FontIcon from 'material-ui/FontIcon'
import TextField from 'material-ui/TextField'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'
import Checkbox from 'material-ui/Checkbox'
import UserAvatar from './user-avatar'
import themes from './user-themes.mss'

import {
  closeDialogButtonStyle,
  modalTitleStyle,
  modalCustomContentStyle,
  modalBodyStyle,
  inviteNewFloatingLabelStyle,
  inviteNewLabelStyle,
  inviteNewInputStyle,
  inviteNewUnderlineFocusStyle,
  inviteSelectIconStyle
} from './invite-dialog.mui-styles'

const simpleControlClasses = 'bg-bondi-blue white br1 b--none pv2 lh-title dim'
const simpleButtonClasses = 'button-reset ph3 ' + simpleControlClasses
const simpleLinkClasses = 'link dib ' + simpleControlClasses

class InviteDialog extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      filterString: '',
      selectedRole: null,
      isOccupant: false,
      inputErrorModalOpen: false
    }

    this.roleTypes = [
      {
        name: 'Tenant',
        canBeOccupant: true
      },
      {
        name: 'Owner/Landlord',
        canBeOccupant: true
      },
      {
        name: 'Contractor'
      },
      {
        name: 'Management Company'
      },
      {
        name: 'Agent'
      }
    ]
  }

  componentDidUpdate () {
    setTimeout(() => { // Had to set timeout as the dialog doesn't create the content immediately
      if (this.inputToFocus && this.inputToFocus !== this.lastFocusedInput) {
        this.lastFocusedInput = this.inputToFocus
        this.inputToFocus.focus()
      }
    }, 300)
  }

  handleEmailChanged = evt => {
    const emailRegex = /^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i
    const { value } = evt.target
    let emailError
    if (!value || !value.match(emailRegex)) {
      emailError = !value ? 'Email is required' : 'This address is invalid'

      // Checking whether the email belongs to an existing role bearer for this unit
    } else if (this.props.potentialInvitees.filter(inv => inv.email === value).length > 0) {
      emailError = 'This email belongs to a user listed in the previous step'
    }
    this.setState({
      inviteeEmail: value,
      emailError
    })
  }

  handleSendInviteClick = () => {
    const { inviteeEmail, emailError, selectedRole, isOccupant } = this.state
    if (!selectedRole || !inviteeEmail || emailError) {
      this.setState({
        inputErrorModalOpen: true
      })
    } else {
      this.props.onNewUserInvited(inviteeEmail, selectedRole.name, isOccupant)
    }
  }

  render () {
    const { basePath, relPath, onRoleUserAdded, potentialInvitees, invitedUserEmails } = this.props
    const matcher = this.state.filterString ? new RegExp(this.state.filterString, 'i') : null
    const filteredUsers = potentialInvitees.length ? potentialInvitees.reduce((all, user, idx) => {
      if (!matcher || (user.name && user.name.match(matcher)) || user.email.match(matcher)) {
        all.push(Object.assign({origIdx: idx, alreadyInvited: invitedUserEmails.includes(user.email)}, user))
      }
      return all
      // TODO: to be used to resolve #80
    }, [])/* .sort((a, b) => {
     if (a.alreadyInvited && !b.alreadyInvited) {
     return 1
     } else if (b.alreadyInvited && !a.alreadyInvited) {
     return -1
     } else {
     return 0
     }
     }) */ : []
    return (
      <Route path={`${basePath}/${relPath}`} children={({match}) => {
        return (
          <Dialog
            title='Who would you like to invite?'
            titleStyle={modalTitleStyle}
            modal
            open={!!match}
            contentStyle={modalCustomContentStyle}
            bodyStyle={modalBodyStyle}
          >
            <Link to={basePath}
              className='link b--none bg-transparent absolute top-1 pt2 right-1 outline-0'>
              <FontIcon className='material-icons' style={closeDialogButtonStyle}>close</FontIcon>
            </Link>
            <Route exact path={`${basePath}/${relPath}`} render={() => (
              <div>
                <div className='flex no-shrink'>
                  <input placeholder='Enter the name or email'
                    className='input-reset ba b--moon-gray outline-0 lh-dbl mb2 ti3 flex-grow'
                    value={this.state.filterString} onChange={evt => this.setState({filterString: evt.target.value})}
                    ref={input => { this.inputToFocus = input }}
                  />
                </div>
                <div className='ba b--moon-gray flex-grow'>
                  <div className='h5 overflow-auto pb2'>
                    {filteredUsers.length ? (
                      <ul className='list mv0 pa0 pt1'>
                        {filteredUsers.map(user => (
                          <li key={user.email}
                            className={
                              themes['theme' + ((user.origIdx % 10) + 1)] + ' flex pv2 ph2 ' +
                              (user.alreadyInvited ? '' : 'dim')
                            }
                            onClick={() => { !user.alreadyInvited && onRoleUserAdded(user) }}>
                            <div className='ml1'>
                              <UserAvatar creator={user.name || user.email} />
                            </div>
                            <div className='ml2 flex-grow'>
                              <div className='f5 bondi-blue'>{user.name || user.email}</div>
                              <div className='f7 gray'>{user.role}</div>
                            </div>
                            {user.alreadyInvited ? (
                              <div className='ml2 flex flex-column items-center justify-center'>
                                <FontIcon className='material-icons' color='var(--success-green)'>check_circle</FontIcon>
                              </div>
                            ) : (
                              <span className='ml2 f6 silver'>Invite</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className='tc i warn-crimson'>We couldn't find any users with the name entered.</p>
                    )}
                  </div>
                </div>
                <div className='no-shrink'>
                  <p className='tc i mid-gray'>Can't find who you're looking for?</p>
                  <Link to={`${basePath}/${relPath}/new`}
                    className={simpleLinkClasses + ' w-100 tc'}>
                    Invite a new user
                  </Link>
                </div>
              </div>
            )} />
            <Route path={`${basePath}/${relPath}/new`} render={() => (
              <div>
                <TextField
                  hintText='Type the email address'
                  floatingLabelText='Email of the user to invite'
                  errorText={this.state.emailError}
                  floatingLabelFixed
                  fullWidth
                  floatingLabelStyle={inviteNewFloatingLabelStyle}
                  inputStyle={inviteNewInputStyle}
                  underlineFocusStyle={inviteNewUnderlineFocusStyle}
                  type='email'
                  required
                  ref={input => { this.inputToFocus = input }}
                  onChange={this.handleEmailChanged}
                />
                <SelectField
                  floatingLabelText='Relationship to this unit'
                  floatingLabelFixed
                  fullWidth
                  floatingLabelStyle={inviteNewFloatingLabelStyle}
                  labelStyle={inviteNewInputStyle}
                  menuStyle={inviteNewInputStyle}
                  iconStyle={inviteSelectIconStyle}
                  underlineFocusStyle={inviteNewUnderlineFocusStyle}
                  value={this.state.selectedRole}
                  onChange={(evt, idx, val) => {
                    this.setState({
                      selectedRole: val,
                      isOccupant: false
                    })
                  }}
                >
                  {this.roleTypes.map(type => (
                    <MenuItem key={type.name} value={type} primaryText={type.name} />
                  ))}
                </SelectField>
                {this.state.selectedRole && this.state.selectedRole.canBeOccupant && (
                  <Checkbox
                    label={`The ${this.state.selectedRole.name} is also the occupant of this unit`}
                    labelStyle={inviteNewLabelStyle}
                    checked={this.state.isOccupant}
                    onCheck={(evt, isChecked) => { this.setState({isOccupant: isChecked}) }}
                  />
                )}
                <div className='flex justify-space mt3'>
                  <button className={simpleButtonClasses} onClick={this.handleSendInviteClick}>
                    Send Invitation
                  </button>
                  <Link to={`${basePath}/${relPath}`} className={simpleLinkClasses + ' ph3'}>
                    Back
                  </Link>
                </div>
                <Dialog
                  title='Please fill in all the details properly'
                  titleStyle={modalTitleStyle}
                  open={this.state.inputErrorModalOpen}
                >
                  <div className='tr'>
                    <button className={simpleButtonClasses + ' mt3'} onClick={() => this.setState({inputErrorModalOpen: false})}>
                      Ok
                    </button>
                  </div>
                </Dialog>
              </div>
            )} />
          </Dialog>
        )
      }} />
    )
  }
}

InviteDialog.propTypes = {
  basePath: PropTypes.string.isRequired,
  relPath: PropTypes.string.isRequired,
  potentialInvitees: PropTypes.array.isRequired,
  onRoleUserAdded: PropTypes.func.isRequired,
  invitedUserEmails: PropTypes.array.isRequired,
  onNewUserInvited: PropTypes.func.isRequired
}

export default InviteDialog
