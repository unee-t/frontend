import React, {Component} from 'react'
import {Link, Route} from 'react-router-dom'
import PropTypes from 'prop-types'
import Dialog from 'material-ui/Dialog'
import FontIcon from 'material-ui/FontIcon'
import TextField from 'material-ui/TextField'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'
import Checkbox from 'material-ui/Checkbox'
import CircularProgress from 'material-ui/CircularProgress'
import UserAvatar from './user-avatar'
import ErrorDialog from './error-dialog'
import { emailValidator } from '../../util/validators'
import themes from './user-themes.mss'

import {
  modalCustomContentStyle,
  modalBodyStyle,
  inviteSuccessIconStyle
} from './invite-dialog.mui-styles'

import {
  textInputFloatingLabelStyle,
  controlLabelStyle,
  textInputStyle,
  textInputUnderlineFocusStyle,
  selectInputIconStyle
} from './form-controls.mui-styles'

import {
  modalTitleStyle,
  closeDialogButtonStyle
} from './generic-dialog.mui-styles'

const simpleControlClasses = 'bg-bondi-blue white br1 b--none pv2 lh-title dim'
const simpleButtonClasses = 'button-reset ph3 ' + simpleControlClasses
const simpleLinkClasses = 'link dib ' + simpleControlClasses

const placeholderUsersMatcher = /^temporary\..+@.+\..+\.?.*\.{0,2}.*$/

const DIALOG_PADDING = 40

class InviteDialog extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      filterString: '',
      selectedRole: null,
      isOccupant: false,
      inputErrorModalOpen: false,
      currMaxHeight: window.innerHeight - DIALOG_PADDING
    }

    window.addEventListener('resize', this.handleWindowResize)

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

  componentWillMount () {
    this.normalizeInvitees(this.props.potentialInvitees)
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.handleWindowResize)
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.potentialInvitees !== nextProps.potentialInvitees) {
      this.normalizeInvitees(nextProps.potentialInvitees)
    }
  }

  normalizeInvitees (invitees) {
    this.normalizedInviteeList = invitees.filter(
      user => !user.login.match(placeholderUsersMatcher)
    )
  }

  handleWindowResize = () => {
    this.setState({
      currMaxHeight: window.innerHeight - DIALOG_PADDING
    })
  }

  handleEmailChanged = evt => {
    const { value } = evt.target
    let emailError
    if (!value || !emailValidator(value)) {
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
    const {
      basePath, relPath, onRoleUserAdded, onRoleUserRemoved, invitedUserEmails, invitationState, onResetInvitation,
      pendingInvitees
    } = this.props
    const { filterString, selectedRole, isOccupant, inputErrorModalOpen, emailError, currMaxHeight } = this.state
    const matcher = filterString ? new RegExp(filterString, 'i') : null
    const allInvitees = this.normalizedInviteeList.concat(pendingInvitees.map(u => Object.assign({pending: true}, u)))
    const filteredUsers = allInvitees.length ? allInvitees.reduce((all, user, idx) => {
      if (!matcher || (user.name && user.name.match(matcher)) || user.login.match(matcher)) {
        all.push(Object.assign({origIdx: idx, alreadyInvited: invitedUserEmails.includes(user.login)}, user))
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
            title={invitationState.loading ? 'Please wait... '
              : !invitationState.completed ? 'Who should be invited?'
              : null
            }
            titleStyle={modalTitleStyle}
            modal
            open={!!match}
            contentStyle={modalCustomContentStyle}
            bodyStyle={Object.assign({maxHeight: currMaxHeight}, modalBodyStyle)}
            autoDetectWindowHeight={false}
          >
            <Link to={basePath} onClick={onResetInvitation}
              className={
                'link b--none bg-transparent absolute top-1 pt2 right-1 outline-0' +
                (invitationState.loading ? ' dn' : '')
              }
            >
              <FontIcon className='material-icons' style={closeDialogButtonStyle}>close</FontIcon>
            </Link>
            <Route exact path={`${basePath}/${relPath}`} render={() => (
              <div className='mt2 flex flex-column flex-grow'>
                <div className='flex no-shrink'>
                  <input placeholder='Enter the name or email'
                    className='input-reset ba b--moon-gray outline-0 lh-dbl mb2 ti3 flex-grow'
                    value={filterString} onChange={evt => this.setState({filterString: evt.target.value})}
                    ref={input => { this.inputToFocus = input }}
                  />
                </div>
                <div className='ba b--moon-gray flex-grow h5 overflow-auto min-h-3'>
                  <div className='pb2'>
                    {filteredUsers.length ? (
                      <ul className='list mv0 pa0 pt1'>
                        {filteredUsers.map((user, idx) => (
                          <li key={idx}
                            className={
                              themes['theme' + ((user.origIdx % 10) + 1)] + ' flex pv2 ph2'
                            }
                            onClick={() => { !user.pending && (user.alreadyInvited ? onRoleUserRemoved(user) : onRoleUserAdded(user)) }}
                          >
                            <div className='ml1'>
                              <UserAvatar user={user} />
                            </div>
                            <div className='ml2 flex-grow overflow-hidden'>
                              <div className={'f5 ellipsis ' + (user.pending ? 'i silver' : 'bondi-blue')}>
                                {user.name || user.login}
                              </div>
                              <div className='f7 gray ellipsis'>{user.role}</div>
                            </div>
                            {user.pending ? (
                              <span className='ml2 f6 silver i'>Pending</span>
                            ) : user.alreadyInvited ? (
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
            <Route path={`${basePath}/${relPath}/new`} render={() => invitationState.completed ? (
              <div className='tc'>
                <FontIcon className='material-icons' style={inviteSuccessIconStyle}>check_circle</FontIcon>
                <p className='f4 mv0'>Awesome! Very soon we’ll send an invite to&nbsp;
                  <span className='fw5'>
                    {invitationState.email}
                  </span>
                  &nbsp;so you could collaborate on this case.
                </p>
                <button className={simpleButtonClasses + ' mt4'} onClick={onResetInvitation}>
                  Invite another user
                </button>
              </div>
            ) : (
              <div className='pt1 mt2'>
                <TextField
                  hintText='Type the email address'
                  floatingLabelText='Email of the user to invite'
                  errorText={emailError}
                  floatingLabelFixed
                  fullWidth
                  floatingLabelStyle={textInputFloatingLabelStyle}
                  inputStyle={textInputStyle}
                  underlineFocusStyle={textInputUnderlineFocusStyle}
                  type='email'
                  required
                  ref={input => { this.inputToFocus = input }}
                  onChange={this.handleEmailChanged}
                  disabled={invitationState.loading}
                />
                <SelectField
                  floatingLabelText='Relationship to this unit'
                  floatingLabelFixed
                  fullWidth
                  floatingLabelStyle={textInputFloatingLabelStyle}
                  labelStyle={textInputStyle}
                  menuStyle={textInputStyle}
                  iconStyle={selectInputIconStyle}
                  underlineFocusStyle={textInputUnderlineFocusStyle}
                  value={selectedRole}
                  onChange={(evt, idx, val) => {
                    this.setState({
                      selectedRole: val,
                      isOccupant: false
                    })
                  }}
                  disabled={invitationState.loading}
                >
                  {this.roleTypes.map(type => (
                    <MenuItem key={type.name} value={type} primaryText={type.name} />
                  ))}
                </SelectField>
                {selectedRole && selectedRole.canBeOccupant && (
                  <Checkbox
                    label={`The ${selectedRole.name} is also the occupant of this unit`}
                    labelStyle={controlLabelStyle}
                    checked={isOccupant}
                    onCheck={(evt, isChecked) => { this.setState({isOccupant: isChecked}) }}
                    disabled={invitationState.loading}
                  />
                )}
                <div className='flex justify-space mt3'>
                  <button
                    className={simpleButtonClasses + ' relative' + (invitationState.loading ? ' o-60' : '')}
                    onClick={this.handleSendInviteClick}
                    disabled={invitationState.loading}
                  >
                    {invitationState.loading && (
                      <div className='absolute top-0 right-0 bottom-0 left-0'>
                        <CircularProgress color='white' size={30} />
                      </div>
                    )}
                    <span className={invitationState.loading ? 'o-0' : ''}>
                      Send Invitation
                    </span>
                  </button>
                  <Link
                    to={`${basePath}/${relPath}`}
                    className={simpleLinkClasses + ' ph3' + (invitationState.loading ? ' disabled o-60' : '')}>
                    Back
                  </Link>
                </div>
                <ErrorDialog
                  show={!!invitationState.errorText || inputErrorModalOpen}
                  text={invitationState.errorText || 'Please fill in all the details properly' || ''}
                  onDismissed={
                    inputErrorModalOpen ? () => this.setState({inputErrorModalOpen: false}) : onResetInvitation
                  }
                />
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
  onRoleUserRemoved: PropTypes.func.isRequired,
  invitedUserEmails: PropTypes.array.isRequired,
  onNewUserInvited: PropTypes.func.isRequired,
  onResetInvitation: PropTypes.func.isRequired,
  invitationState: PropTypes.object.isRequired,
  pendingInvitees: PropTypes.array
}

export default InviteDialog
