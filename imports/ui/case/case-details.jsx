import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link, withRouter } from 'react-router-dom'
import FontIcon from 'material-ui/FontIcon'
import RaisedButton from 'material-ui/RaisedButton'
import IconButton from 'material-ui/IconButton'
import _, { negate, flow } from 'lodash'
import moment from 'moment'
import themes from '../components/user-themes.mss'
import { attachmentTextMatcher, placeholderEmailMatcher } from '../../util/matchers'
import { userInfoItem } from '/imports/util/user.js'
import { fitDimensions } from '../../util/cloudinary-transformations'
import UsersSearchList from '../components/users-search-list'
import InviteDialog from '../dialogs/invite-dialog'
import { TYPE_CC, TYPE_ASSIGNED } from '../../api/pending-invitations'
import EditableItem from '../components/editable-item'
import ErrorDialog from '../dialogs/error-dialog'
import { infoItemLabel, infoItemMembers, InfoItemContainer, InfoItemRow } from '../util/static-info-rendering'

import { addPersonIconStyle } from './case.mui-styles'

const mediaItemsPadding = 4 // Corresponds with the classNames set to the media items
const mediaItemRowCount = 3

class CaseDetails extends Component {
  constructor (props) {
    super(props)
    this.state = {
      filterString: '',
      fieldValues: {},
      immediateStatusVal: props.caseItem.status,
      chosenAssigned: null,
      usersToBeInvited: [],
      normalizedUnitUsers: null
    }
  }

  componentWillMount () {
    this.setState({
      normalizedUnitUsers: this.normalizeUnitUsers()
    })
  }

  componentDidMount () {
    this.setState({
      computedMediaItemWidth: Math.round((this.refs.media.clientWidth - (2 * mediaItemsPadding)) / mediaItemRowCount)
    })
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.caseItem.status !== this.props.caseItem.status) {
      this.setState({
        immediateStatusVal: nextProps.caseItem.status
      })
    }
    if (nextProps.unitUsers !== this.props.unitUsers) {
      this.setState({
        normalizedUnitUsers: this.normalizeUnitUsers()
      })
    }
  }

  normalizeUnitUsers = () => this.props.unitUsers.filter(flow([
    u => u.login,
    negate(placeholderEmailMatcher)
  ]))

  handleStatusEdit = val => {
    const matchingValDef = this.props.cfvDictionary.status.values.find(({name}) => name === val)
    this.setState({
      immediateStatusVal: val
    })
    const changeSet = {status: val}
    if (!matchingValDef.is_open) { // Means it needs a resolution
      changeSet.resolution = 'FIXED' // hardcoded for now
    }
    this.props.onFieldEdit(changeSet)
  }

  renderTitle = ({id, title}) => (
    <InfoItemContainer>
      <EditableItem
        label={`Case: #${id}`}
        initialValue={title}
        onEdit={val => this.props.onFieldEdit({title: val})}
      />
    </InfoItemContainer>
  )

  renderUnitName = unitItem => <InfoItemRow label='Unit name:' value={unitItem.name} />

  renderUnitDescription = unitItem => <InfoItemRow label='Unit description:' value={unitItem.description} />

  renderStatusLine = ({status}, {status: statusDef}) => {
    const { immediateStatusVal } = this.state
    return (
      <InfoItemContainer>
        <EditableItem
          label='Status:'
          initialValue={status}
          selectionList={
            statusDef.values
              .find(({name}) => name === immediateStatusVal)['can_change_to']
              .map(({name}) => name)
              .concat([immediateStatusVal])
          }
          onEdit={this.handleStatusEdit}
        />
      </InfoItemContainer>
    )
  }

  renderCategoriesLine = ({category, subCategory}) => (
    <InfoItemContainer>
      <div className='flex'>
        <div className='flex-grow'>
          {infoItemMembers('Category:', category || '---')}
        </div>
        <div className='flex-grow'>
          {infoItemMembers('Sub-Category:', subCategory || '---')}
        </div>
      </div>
    </InfoItemContainer>
  )

  renderCreatedBy = user => (
    <div className='bt bw3 b--very-light-gray'>
      <InfoItemContainer>
        {infoItemLabel('Created by:')}
        {userInfoItem(user)}
      </InfoItemContainer>
    </div>
  )

  renderAssignedTo = (assignedUser, normalizedUnitUsers, pendingInvitations) => {
    const { match, invitationState, onResetInvitation, onNewUserAssigned, onExistingUserAssigned } = this.props
    const { chosenAssigned } = this.state
    const pendingUsers = pendingInvitations.map(inv => {
      const { bugzillaCreds: { login }, profile: { name }, emails: [{address: email}] } = inv.inviteeUser()
      return {
        name,
        login,
        email,
        role: inv.role,
        type: inv.type
      }
    })
    const resolvedAssignedUser = pendingUsers.find(u => u.type === TYPE_ASSIGNED) || assignedUser
    const resolvedChosenAssigned = chosenAssigned || resolvedAssignedUser
    return (
      <InfoItemContainer>
        {infoItemLabel('Assigned to:')}
        {userInfoItem(resolvedAssignedUser, user => (
          <Link to={`${match.url}/assign`} className='link outline-0'>
            <IconButton>
              <FontIcon className='material-icons' color='#999'>edit</FontIcon>
            </IconButton>
          </Link>
        ))}
        <InviteDialog
          {...{invitationState, onResetInvitation}}
          onNewUserInvited={onNewUserAssigned}
          basePath={match.url} relPath='assign'
          title='Who should be assigned?'
          linkLabelForNewUser='Invite a new assignee'
          mainOperationText='Assign case'
          disableMainOperation={!chosenAssigned || chosenAssigned.login === resolvedAssignedUser.login}
          onMainOperation={() => onExistingUserAssigned(chosenAssigned)}
          additionalOperationText='Assign to someone else'
          potentialInvitees={normalizedUnitUsers.concat(pendingUsers.map(u => Object.assign({pending: true}, u)))}
          selectControlsRenderer={({users, inputRefFn}) => (
            <UsersSearchList
              users={users}
              onUserClick={user => this.setState({chosenAssigned: user})}
              searchInputRef={inputRefFn}
              userClassNames={user => user.login === resolvedChosenAssigned.login ? 'bg-very-light-gray' : ''}
              emptyListMessage={'We couldn\'t find any existing users to assign'}
              userStatusRenderer={user => {
                if (user.pending) {
                  return (
                    <span className='f7 silver i'>Pending</span>
                  )
                }
                if (user.login === resolvedAssignedUser.login) {
                  return (
                    <span className='f7 gray b'>Assigned</span>
                  )
                }
              }}
            />
          )}
        />
      </InfoItemContainer>
    )
  }

  renderPeopleInvolved = (
    caseItem, unitItem, {creator, assignee, subscribed}, normalizedUnitUsers, pendingInvitations,
    successAdded, addUsersError
  ) => {
    const {
      match, onNewUserInvited, invitationState, onResetInvitation, onRoleUserRemoved, onRoleUsersInvited,
      onClearRoleUsersState
    } = this.props
    const { usersToBeInvited } = this.state
    const pendingUsers = pendingInvitations.filter(inv => inv.type === TYPE_CC).map(inv => {
      const { bugzillaCreds: { login }, profile: { name } } = inv.inviteeUser()
      return {
        name,
        login,
        role: inv.role
      }
    })
    const invitedUsersEmails = subscribed.map(u => u.login)
    return (
      <InfoItemContainer>
        {infoItemLabel('People involved:')}
        {subscribed.map((user, ind) => userInfoItem(user, user => (
          <IconButton onClick={() => onRoleUserRemoved(user)}>
            <FontIcon className='material-icons' color='#999'>close</FontIcon>
          </IconButton>
        )))}
        {pendingUsers.map((user, ind) => userInfoItem(user, () => <span className='f7 warn-crimson b'>Pending</span>))}
        <Link to={`${match.url}/invite`}
          className='mt2 link flex items-center outline-0'>
          <div className={[themes.sized, themes.size1, 'br-100 ba b--moon-gray bg-transparent tc'].join(' ')}>
            <FontIcon className='material-icons' style={addPersonIconStyle}>person_add</FontIcon>
          </div>
          <div className='ml2 pl1 bondi-blue'>Invite users to case</div>
        </Link>
        <InviteDialog
          {...{onNewUserInvited, invitationState}}
          basePath={match.url} relPath='invite'
          title='Who should be invited?'
          onMainOperation={() => {
            onRoleUsersInvited(usersToBeInvited)
            this.setState({
              usersToBeInvited: []
            })
          }}
          linkLabelForNewUser='Invite a new user'
          mainOperationText='Send invitation'
          onResetInvitation={() => {
            onResetInvitation()
            onClearRoleUsersState()
          }}
          disableMainOperation={usersToBeInvited.length === 0}
          additionalOperationText='Invite more users'
          potentialInvitees={normalizedUnitUsers.filter(u =>
            u.login !== creator.login && u.login !== assignee.login && !invitedUsersEmails.includes(u.login)
          )}
          mainOperationSuccessContent={!successAdded ? null : (
            <div>
              <p className='f4 mv0'>
                Awesome! We've sent an invite to&nbsp;
                {successAdded
                  .map(loginName => normalizedUnitUsers.find(u => u.login === loginName))
                  .reduce((all, user, idx, arr) => { // Creating a comma/"and" delimited list of users
                    if (all.length > 0) {
                      if (idx < arr.length - 1) {
                        all.push(<span key={all.length}>, </span>)
                      } else {
                        all.push(<span key={all.length}> and </span>)
                      }
                    }
                    all.push(<span className='bondi-blue' key={all.length}>{user.name || user.login}</span>)
                    return all
                  }, [])
                }
                &nbsp;to collaborate on the case&nbsp;
                <span className='b'>"{caseItem.title}"</span>
                &nbsp;for the unit&nbsp;
                <span className='b'>{unitItem.name}</span>
              </p>
              <RaisedButton className='mt4' label='Invite another person' labelColor='white' backgroundColor='var(--bondi-blue)'
                onClick={onClearRoleUsersState}
              />
            </div>
          )}
          selectControlsRenderer={({users, inputRefFn}) => (
            <UsersSearchList
              users={users}
              onUserClick={user => this.setState({
                usersToBeInvited: usersToBeInvited.includes(user.login)
                  ? usersToBeInvited.filter(u => u !== user.login)
                  : usersToBeInvited.concat([user.login])
              })}
              emptyListMessage='All the known users for this unit are already invited'
              searchInputRef={inputRefFn}
              userStatusRenderer={user => (
                <div className='flex flex-column items-center justify-center'>
                  {usersToBeInvited.includes(user.login) ? (
                    <FontIcon className='material-icons' color='var(--success-green)'>check_circle</FontIcon>
                  ) : (
                    <FontIcon className='material-icons' color='var(--silver)'>panorama_fish_eye</FontIcon>
                  )}
                </div>
              )}
            />
          )}
        />
        <ErrorDialog
          show={!!addUsersError}
          text={
            addUsersError
              ? ('We couldn\'t add these users to this case due to: ' + addUsersError.error)
              : ''
          }
          onDismissed={onClearRoleUsersState}
        />
      </InfoItemContainer>
    )
  }

  renderResolutions = (
    {
      nextSteps,
      nextStepsBy,
      solution,
      solutionDeadline
    }
  ) => {
    const { onFieldEdit } = this.props
    return (
      <div className='bt bw3 b--very-light-gray'>
        <InfoItemContainer>
          <EditableItem
            label='Solution'
            initialValue={solution}
            onEdit={val => onFieldEdit({solution: val})}
            isMultiLine
          />
          {solutionDeadline && (
            <div className='mt2 f7 warn-crimson b'>
              Deadline: {moment(solutionDeadline).format('D MMM YYYY, h:mm')} hrs
            </div>
          )}
        </InfoItemContainer>
        <InfoItemContainer>
          <EditableItem
            label='Next steps'
            initialValue={nextSteps}
            onEdit={val => onFieldEdit({nextSteps: val})}
            isMultiLine
          />
          {solutionDeadline && (
            <div className='mt2 f7 warn-crimson b'>
              Deadline: {moment(nextStepsBy).format('D MMM YYYY, h:mm')} hrs
            </div>
          )}
        </InfoItemContainer>
      </div>
    )
  }

  render () {
    const { caseItem, comments, unitItem, caseUserTypes, pendingInvitations, cfvDictionary, caseUsersState } = this.props
    const { normalizedUnitUsers } = this.state
    let successfullyAddedUsers, addUsersError
    if (parseInt(caseUsersState.caseId) === parseInt(caseItem.id)) {
      successfullyAddedUsers = caseUsersState.added
      addUsersError = caseUsersState.error
    }
    return (
      <div className='flex-grow overflow-auto h-100'>
        {this.renderTitle(caseItem)}
        {this.renderUnitName(unitItem)}
        {this.renderUnitDescription(unitItem)}
        {this.renderStatusLine(caseItem, cfvDictionary)}
        {this.renderCategoriesLine(caseItem)}
        {this.renderCreatedBy(caseUserTypes.creator)}
        {this.renderAssignedTo(caseUserTypes.assignee, normalizedUnitUsers, pendingInvitations)}
        {this.renderPeopleInvolved(
          caseItem, unitItem, caseUserTypes, normalizedUnitUsers, pendingInvitations,
          successfullyAddedUsers, addUsersError
        )}
        {this.renderResolutions(caseItem)}
        {this.renderMediaSection(comments)}
      </div>
    )
  }
  renderMediaSection (comments) {
    const attachments = _.chain(comments)
      .filter(c => attachmentTextMatcher(c.text))
      .map(c => [c.text.split('\n')[1], c.id])
      .value()
    const size = this.state.computedMediaItemWidth
    return (
      <div className='bt bw3 b--light-gray'>
        <InfoItemContainer>
          {infoItemLabel('Attachments:')}
          <div className='ma1 grid col3-1fr gap1 flow-row' ref='media'>
            {attachments.map(([url, id], ind) => (
              <img src={size && fitDimensions(url, size, size)} alt={url} key={ind}
                onClick={() => this.props.onSelectAttachment(id)}
              />
            ))}
          </div>
        </InfoItemContainer>
      </div>
    )
  }
}

CaseDetails.propTypes = {
  caseItem: PropTypes.object.isRequired,
  unitItem: PropTypes.object.isRequired,
  comments: PropTypes.array.isRequired,
  onSelectAttachment: PropTypes.func.isRequired,
  onRoleUsersInvited: PropTypes.func.isRequired,
  onRoleUserRemoved: PropTypes.func.isRequired,
  onNewUserInvited: PropTypes.func.isRequired,
  onNewUserAssigned: PropTypes.func.isRequired,
  onClearRoleUsersState: PropTypes.func.isRequired,
  onExistingUserAssigned: PropTypes.func.isRequired,
  onResetInvitation: PropTypes.func.isRequired,
  unitUsers: PropTypes.array.isRequired,
  invitationState: PropTypes.object.isRequired,
  caseUserTypes: PropTypes.object.isRequired,
  onFieldEdit: PropTypes.func.isRequired,
  cfvDictionary: PropTypes.object.isRequired,
  caseUsersState: PropTypes.object.isRequired,
  pendingInvitations: PropTypes.array
}

export default withRouter(CaseDetails)
