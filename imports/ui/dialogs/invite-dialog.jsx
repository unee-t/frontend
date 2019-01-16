import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Route } from 'react-router-dom'
import { replace, goBack } from 'react-router-redux'
import PropTypes from 'prop-types'
import Dialog from 'material-ui/Dialog'
import FontIcon from 'material-ui/FontIcon'
import CircularProgress from 'material-ui/CircularProgress'
import RaisedButton from 'material-ui/RaisedButton'
import ErrorDialog from './error-dialog'
import EmailInput from '../components/email-input'
import UnitRoleSelect from '../components/unit-role-select'

import {
  modalTitleStyle,
  closeDialogButtonStyle,
  modalBodyStyle,
  modalCustomContentStyle,
  inviteSuccessIconStyle
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
      inviteeEmail: '',
      currMaxHeight: window.innerHeight - DIALOG_PADDING
    }

    window.addEventListener('resize', this.handleWindowResize)
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

  handleAdditionalOpsClick = () => {
    this.setState({
      selectedRole: null,
      isOccupant: false,
      inviteeEmail: ''
    })
    this.props.onResetInvitation()
  }

  render () {
    const {
      basePath, relPath, invitationState, selectControlsRenderer, potentialInvitees,
      title, additionalOperationText, mainOperationText, onMainOperation, disableMainOperation, linkLabelForNewUser,
      mainOperationSuccessContent, dispatch
    } = this.props
    const { selectedRole, isOccupant, inputErrorModalOpen, inviteeEmail, currMaxHeight } = this.state
    return (
      <Route path={`${basePath}/${relPath}`} children={({ match }) => {
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
            bodyStyle={Object.assign({ maxHeight: currMaxHeight }, modalBodyStyle)}
            autoDetectWindowHeight={false}
          >
            <a
              onClick={() => {
                this.handleAdditionalOpsClick()
                dispatch(goBack())
              }}
              className={
                'link b--none bg-transparent absolute top-1 pt2 right-1 outline-0' +
                (invitationState.loading ? ' dn' : '')
              }
            >
              <FontIcon className='material-icons' style={closeDialogButtonStyle}>close</FontIcon>
            </a>
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
                      <a
                        className='link b bondi-blue'
                        onClick={() => {
                          dispatch(replace(`${basePath}/${relPath}/new`))
                        }}
                      >
                        {linkLabelForNewUser}
                      </a>
                    </p>
                  </div>
                </div>
              )
            } />
            <Route path={`${basePath}/${relPath}/new`} render={() => invitationState.completed ? successWrapper(
              <div>
                <p className='f4 mv0'>
              Awesome! We just sent an invite to <span className='fw5'>{invitationState.email}</span> so you could collaborate on this case.
                </p>
                <button className={simpleButtonClasses + ' mt4'} onClick={this.handleAdditionalOpsClick}>
                  {additionalOperationText}
                </button>
              </div>
            ) : (
              <div className='pt1 mt2'>
                <EmailInput
                  label='Email of the user to invite'
                  onEmailChanged={email => this.setState({ inviteeEmail: email })}
                  email={inviteeEmail}
                  invalidReasonMessage='This email belongs to a user listed in the previous step'
                  invalidEmails={potentialInvitees.map(i => i.email)}
                  onValidityChanged={isValid => this.setState({ emailError: !isValid })}
                  inputRef={input => { this.inputToFocus = input }}
                  disabled={invitationState.loading}
                />
                <UnitRoleSelect
                  selectedRole={selectedRole}
                  onRoleSelected={role => this.setState({ selectedRole: role })}
                  isOccupant={isOccupant}
                  onOccupantToggled={isIt => this.setState({ isOccupant: isIt })}
                  disabled={invitationState.disabled}
                />
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
                  <a
                    className={simpleLinkClasses + ' ph3' + (invitationState.loading ? ' disabled o-60' : '')}
                    onClick={() => {
                      dispatch(replace(`${basePath}/${relPath}`))
                    }}
                  >
                    Back
                  </a>
                </div>
                <ErrorDialog
                  show={!!invitationState.errorText || inputErrorModalOpen}
                  text={invitationState.errorText || 'Please fill in all the details properly' || ''}
                  onDismissed={
                    inputErrorModalOpen ? () => this.setState({ inputErrorModalOpen: false }) : this.handleAdditionalOpsClick
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

export default connect(() => ({}))(InviteDialog)
