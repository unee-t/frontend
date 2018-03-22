import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link, withRouter } from 'react-router-dom'
import FontIcon from 'material-ui/FontIcon'
import IconButton from 'material-ui/IconButton'
import _ from 'lodash'
import moment from 'moment'
import themes from '../components/user-themes.mss'
import UserAvatar from '../components/user-avatar'
import { attachmentTextMatcher } from '../../util/matchers'
import { fitDimensions } from '../../util/cloudinary-transformations'
import UsersSearchList from '../components/users-search-list'
import InviteDialog from '../dialogs/invite-dialog'
import { TYPE_CC, TYPE_ASSIGNED } from '../../api/pending-invitations'
import PopoverButton from '../components/popover-button'
import EditableItem from '../components/editable-item'

import {
  detailLineIconColor,
  addPersonIconStyle
} from './case.mui-styles'

const IconDetailRowWrapper = props => (
  <div className={'bb b--gray-93 ph3 h2-5 flex items-center w-100' + (props.extraClasses ? ' ' + props.extraClasses : '')}>
    <FontIcon className='material-icons mr4' color={detailLineIconColor}>{props.iconName}</FontIcon>
    <div className='flex-grow ellipsis'>{props.children}</div>
  </div>
)
IconDetailRowWrapper.propTypes = {
  iconName: PropTypes.string.isRequired,
  extraClasses: PropTypes.string
}

const infoItemLabel = label => (<div key='label' className='mt1 f6 bondi-blue'>{label}</div>)
const infoItemMembers = (label, value) => [
  (infoItemLabel(label)),
  (<div key='value' className='mt2 mid-gray lh-copy'>{value}</div>)
]

const InfoItemContainer = ({children}) => (
  <div className='bb b--gray-93 ph3 pt2 pb3'>
    {children}
  </div>
)

const infoItemRow = (label, value) => (
  <InfoItemContainer>
    {infoItemMembers(label, value)}
  </InfoItemContainer>
)

const userInfoItem = (user, theme, rightRenderer) => (
  <div key={user.login} className={theme + ' flex pt2'}>
    <UserAvatar user={user} />
    <div className='ml2 pl1 flex-grow overflow-hidden'>
      <div className='mid-gray ellipsis'>{user.name || user.login}</div>
      <div className='mt1 f7 gray ellipsis'>{user.role || 'Administrator'}</div>
    </div>
    {rightRenderer && rightRenderer(user)}
  </div>
)

const mediaItemsPadding = 4 // Corresponds with the classNames set to the media items
const mediaItemRowCount = 3

class CaseDetails extends Component {
  constructor (props) {
    super(props)
    this.state = {
      filterString: '',
      fieldValues: {},
      immediateStatusVal: props.caseItem.status
    }
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
  }

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

  renderUnitName = unitItem => infoItemRow('Unit name:', unitItem.name)

  renderUnitDescription = unitItem => infoItemRow('Unit description:', unitItem.description)

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
        {userInfoItem(user, themes.theme1)}
      </InfoItemContainer>
    </div>
  )

  renderAssignedTo = (assignedUser, unitUsers, pendingInvitations) => {
    const { match, invitationState, onResetInvitation, onNewUserAssigned, onExistingUserAssigned } = this.props
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
    return (
      <InfoItemContainer>
        {infoItemLabel('Assigned to:')}
        {userInfoItem(resolvedAssignedUser, themes.theme2, user => (
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
          additionalOperationText='Assign to someone else'
          potentialInvitees={unitUsers}
          pendingInvitees={pendingUsers}
          selectControlsRenderer={({allInvitees, inputRefFn}) => (
            <div className='flex flex-column flex-grow'>
              <PopoverButton buttonText={
                resolvedAssignedUser.name || resolvedAssignedUser.email || resolvedAssignedUser.login
              }>
                <div className='pa1 ba b--moon-gray br2 flex-grow flex flex-column'>
                  <UsersSearchList
                    users={allInvitees}
                    onUserClick={onExistingUserAssigned}
                    searchInputRef={inputRefFn}
                    userClassNames={user => user.login === resolvedAssignedUser.login ? 'bg-very-light-gray' : ''}
                    userStatusRenderer={user => user.pending && (
                      <span className='f6 silver i'>Pending</span>
                    )}
                  />
                </div>
              </PopoverButton>
            </div>
          )}
        />
      </InfoItemContainer>
    )
  }

  renderPeopleInvolved = ({creator, assignee, subscribed}, unitUsers, pendingInvitations) => {
    const {
      match, onRoleUserAdded, onNewUserInvited, invitationState, onResetInvitation, onRoleUserRemoved
    } = this.props
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
        {subscribed.map((user, ind) => userInfoItem(user, themes['theme' + ((ind + 2) % 10 + 1)]))}
        {pendingUsers.map((user, ind) => userInfoItem(user, themes['theme' + ((ind + 2 + subscribed.length) % 10 + 1)]))}
        <Link to={`${match.url}/invite`}
          className='mt2 link flex items-center outline-0'>
          <div className={[themes.sized, themes.size1, 'br-100 ba b--moon-gray bg-transparent tc'].join(' ')}>
            <FontIcon className='material-icons' style={addPersonIconStyle}>person_add</FontIcon>
          </div>
          <div className='ml2 pl1 bondi-blue'>Invite or remove users</div>
        </Link>
        <InviteDialog
          {...{onNewUserInvited, invitationState, onResetInvitation}}
          basePath={match.url} relPath='invite'
          title='Who should be invited?'
          additionalOperationText='Invite another user'
          potentialInvitees={unitUsers
            .filter(u => u.login !== creator.login && u.login !== assignee.login)
            .map(u => Object.assign({alreadyInvited: invitedUsersEmails.includes(u.login)}, u))
          }
          pendingInvitees={pendingUsers}
          selectControlsRenderer={({allInvitees, inputRefFn}) => (
            <UsersSearchList
              users={allInvitees}
              onUserClick={user => !user.pending && (user.alreadyInvited
                ? onRoleUserRemoved(user)
                : onRoleUserAdded(user))
              }
              searchInputRef={inputRefFn}
              userStatusRenderer={user =>
                user.pending ? (
                  <span className='f6 silver i'>Pending</span>
                ) : user.alreadyInvited ? (
                  <div className='flex flex-column items-center justify-center'>
                    <FontIcon className='material-icons' color='var(--success-green)'>check_circle</FontIcon>
                  </div>
                ) : (
                  <span className='f6 silver'>Invite</span>
                )
              }
            />
          )}
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
    const { caseItem, comments, unitUsers, unitItem, caseUserTypes, pendingInvitations, cfvDictionary } = this.props
    return (
      <div className='flex-grow overflow-auto h-100'>
        {this.renderTitle(caseItem)}
        {this.renderUnitName(unitItem)}
        {this.renderUnitDescription(unitItem)}
        {this.renderStatusLine(caseItem, cfvDictionary)}
        {this.renderCategoriesLine(caseItem)}
        {this.renderCreatedBy(caseUserTypes.creator)}
        {this.renderAssignedTo(caseUserTypes.assignee, unitUsers, pendingInvitations)}
        {this.renderPeopleInvolved(caseUserTypes, unitUsers, pendingInvitations)}
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
  onRoleUserAdded: PropTypes.func.isRequired,
  onRoleUserRemoved: PropTypes.func.isRequired,
  onNewUserInvited: PropTypes.func.isRequired,
  onNewUserAssigned: PropTypes.func.isRequired,
  onExistingUserAssigned: PropTypes.func.isRequired,
  onResetInvitation: PropTypes.func.isRequired,
  unitUsers: PropTypes.array.isRequired,
  invitationState: PropTypes.object.isRequired,
  caseUserTypes: PropTypes.object.isRequired,
  onFieldEdit: PropTypes.func.isRequired,
  cfvDictionary: PropTypes.object.isRequired,
  pendingInvitations: PropTypes.array
}

export default withRouter(CaseDetails)
