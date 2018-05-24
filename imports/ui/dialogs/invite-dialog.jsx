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
import RaisedButton from 'material-ui/RaisedButton'
import ErrorDialog from './error-dialog'
import { emailValidator } from '../../util/validators'

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
} from '../components/form-controls.mui-styles'

import {
  modalTitleStyle,
  closeDialogButtonStyle
} from './generic-dialog.mui-styles'

const simpleControlClasses = 'bg-bondi-blue white br1 b--none pv2 lh-title dim'
const simpleButtonClasses = 'button-reset ph3 ' + simpleControlClasses
const simpleLinkClasses = 'link dib ' + simpleControlClasses

const DIALOG_PADDING = 40

const successWrapper = content => (
  <div className='tc'>
    <FontIcon className='material-icons' style={inviteSuccessIconStyle}>check_circle</FontIcon>
    {content}
  </div>
)

class InviteDialog extends Component {
  constructor () {
    super(...arguments)
    this.state = {
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

  componentWillUnmount () {
    window.removeEventListener('resize', this.handleWindowResize)
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
      basePath, relPath, invitationState, onResetInvitation, selectControlsRenderer, potentialInvitees,
      title, additionalOperationText, mainOperationText, onMainOperation, disableMainOperation, linkLabelForNewUser,
      mainOperationSuccessContent
    } = this.props
    const { selectedRole, isOccupant, inputErrorModalOpen, emailError, currMaxHeight } = this.state
    return (
      <Route path={`${basePath}/${relPath}`} children={({match}) => {
        return (
          <Dialog
            title={invitationState.loading ? 'Please wait... '
              : (!invitationState.completed && !mainOperationSuccessContent) ? title
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
            <Route exact path={`${basePath}/${relPath}`} render={() => mainOperationSuccessContent
              ? successWrapper(mainOperationSuccessContent)
              : (
                <div className='mt2 flex flex-column flex-grow'>
                  {selectControlsRenderer({
                    users: potentialInvitees,
                    inputRefFn: el => { this.inputToFocus = el }
                  })}
                  <div className='no-shrink pt2'>
                    <RaisedButton className='mt1' fullWidth backgroundColor='var(--bondi-blue)'
                      onClick={onMainOperation} disabled={disableMainOperation}
                    >
                      <span className={'b ' + (disableMainOperation ? 'gray' : 'white')}>
                        {mainOperationText}
                      </span>
                    </RaisedButton>
                    <p className='tc i mid-gray lh-title mt3 mb0'>
                      Can't find who you're looking for?&nbsp;
                      <Link to={`${basePath}/${relPath}/new`}
                        className='link b bondi-blue'>
                        {linkLabelForNewUser}
                      </Link>
                    </p>
                  </div>
                </div>
              )
            } />
            <Route path={`${basePath}/${relPath}/new`} render={() => invitationState.completed ? successWrapper(
              <div>
                <p className='f4 mv0'>Awesome! We just sent an invite to&nbsp;
                  <span className='fw5'>
                    {invitationState.email}
                  </span>
                  &nbsp;so you could collaborate on this case.
                </p>
                <button className={simpleButtonClasses + ' mt4'} onClick={onResetInvitation}>
                  {additionalOperationText}
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
  title: PropTypes.string.isRequired,
  potentialInvitees: PropTypes.array.isRequired,
  onNewUserInvited: PropTypes.func.isRequired,
  onResetInvitation: PropTypes.func.isRequired,
  invitationState: PropTypes.object.isRequired,
  selectControlsRenderer: PropTypes.func.isRequired,
  additionalOperationText: PropTypes.string.isRequired,
  mainOperationText: PropTypes.string.isRequired,
  onMainOperation: PropTypes.func.isRequired,
  linkLabelForNewUser: PropTypes.string.isRequired,
  disableMainOperation: PropTypes.bool,
  mainOperationSuccessContent: PropTypes.element
}

export default InviteDialog
