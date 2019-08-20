import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link, withRouter, Route } from 'react-router-dom'
import { goBack } from 'react-router-redux'
import { connect } from 'react-redux'
import FontIcon from 'material-ui/FontIcon'
import RaisedButton from 'material-ui/RaisedButton'
import IconButton from 'material-ui/IconButton'
import { negate, flow } from 'lodash'
import moment from 'moment'
import { attachmentTextMatcher, placeholderEmailMatcher } from '../../util/matchers'
import { userInfoItem } from '/imports/util/user.js'
import { fitDimensions } from '../../util/cloudinary-transformations'
import UsersSearchList from '../components/users-search-list'
import InviteDialog from '../dialogs/invite-dialog'
import { TYPE_CC, TYPE_ASSIGNED } from '../../api/pending-invitations'
import EditableItem from '../components/editable-item'
import ErrorDialog from '../dialogs/error-dialog'
import { infoItemLabel, InfoItemContainer, InfoItemRow } from '../util/static-info-rendering'
import AddUserControlLine from '../components/add-user-control-line'
import AssigneeSelectionList from '../components/assignee-selection-list'
import CaseTargetAttrDialog from '../dialogs/case-target-attr-dialog'

const mediaItemsPadding = 4 // Corresponds with the classNames set to the media items
const mediaItemRowCount = 3

const renderEditableTargetAttribute = (
  {
    attrName, value, targetDate, editUrl, showTime = false
  }
) => (
  <InfoItemContainer>
    {infoItemLabel(`${attrName}:`)}
    <div className='flex items-end'>
      <div className='flex-grow'>
        {value
          ? (
            <div className='mid-gray lh-copy'>
              {value}
            </div>
          ) : (
            <div className='moon-gray i lh-copy'>
              (Not specified)
            </div>
          )
        }
        {targetDate && (
          <div className='mt2 f7 warn-crimson b'>
            Deadline: {moment(targetDate).format('YYYY-MM-DD' + (showTime ? ', h:mm' : ''))}{showTime ? ' hrs' : ''}
          </div>
        )}
      </div>
      <div>
        <Link to={editUrl} className='link outline-0'>
          <IconButton>
            <FontIcon className='material-icons' color='#999'>edit</FontIcon>
          </IconButton>
        </Link>
      </div>
    </div>
  </InfoItemContainer>
)

class CaseDetails extends Component {
  audioRefs = {}
  imageMediaContainer = null
  audioMediaContainer = null
  constructor (props) {
    super(props)
    this.state = {
      filterString: '',
      fieldValues: {},
      immediateStatusVal: props.caseItem.status,
      chosenAssigned: null,
      usersToBeInvited: [],
      normalizedUnitUsers: null,
      audioDurations: {},
      playingAudioId: null,
      computedAudioMediaItemWidth: 100,
      computedImageMediaItemWidth: 100
    }
  }

  componentWillMount () {
    this.setState({
      normalizedUnitUsers: this.normalizeUnitUsers()
    })
  }

  componentDidMount () {
    this.recalcMediaItemsWidth()
  }

  componentDidUpdate () {
    this.recalcMediaItemsWidth()
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

  recalcMediaItemsWidth = () => {
    const changes = {}
    const { computedImageMediaItemWidth, computedAudioMediaItemWidth } = this.state
    if (this.imageMediaContainer) {
      const currImageItemWidth = Math.round((this.imageMediaContainer.clientWidth - (2 * mediaItemsPadding)) / mediaItemRowCount)
      if (computedImageMediaItemWidth !== currImageItemWidth) {
        Object.assign(changes, {
          computedImageMediaItemWidth: currImageItemWidth
        })
      }
    }
    if (this.audioMediaContainer) {
      const currAudioItemWidth = Math.round((this.audioMediaContainer.clientWidth - (2 * mediaItemsPadding)) / mediaItemRowCount)
      if (computedAudioMediaItemWidth !== currAudioItemWidth) {
        Object.assign(changes, {
          computedAudioMediaItemWidth: Math.round((this.audioMediaContainer.clientWidth - (2 * mediaItemsPadding)) / mediaItemRowCount)
        })
      }
    }

    if (Object.keys(changes).length > 0) {
      this.setState(changes)
    }
  }

  normalizeUnitUsers = () => this.props.unitUsers.filter(flow([
    u => u.login,
    negate(placeholderEmailMatcher)
  ]))

  handleStatusEdit = val => {
    const { caseFieldValues, onFieldEdit } = this.props
    const matchingValDef = caseFieldValues.status.values.find(({ name }) => name === val)
    this.setState({
      immediateStatusVal: val
    })
    const changeSet = { status: val }
    if (!matchingValDef.is_open) { // Means it needs a resolution
      changeSet.resolution = 'FIXED' // hardcoded for now
    }
    onFieldEdit(changeSet)
  }

  handleAudioRef = (el, id) => {
    if (!el) return
    this.audioRefs[id] = el
  }

  handleAudioMetaDataLoaded = (evt, id) => {
    const { audioDurations } = this.state

    this.setState({
      audioDurations: {
        ...audioDurations,
        [id.toString()]: evt.target.duration
      }
    })
  }

  handleAudioAttachmentClicked = id => {
    const audio = this.audioRefs[id.toString()]
    const { playingAudioId } = this.state
    if (playingAudioId === id) {
      audio.removeEventListener('ended', this.handleAudioEnded)
      audio.pause()
      audio.currentTime = 0
      this.setState({
        playingAudioId: null
      })
    } else {
      if (playingAudioId) {
        const prevAudio = this.audioRefs[playingAudioId.toString()]
        prevAudio.removeEventListener('ended', this.handleAudioEnded)
        prevAudio.pause()
        prevAudio.currentTime = 0
      }
      audio.addEventListener('ended', this.handleAudioEnded)
      audio.play()
      this.setState({
        playingAudioId: id
      })
    }
  }

  handleAudioEnded = evt => {
    evt.target.removeEventListener('ended', this.handleAudioEnded)
    this.setState({
      playingAudioId: null
    })
  }

  formatAudioDuration = (duration) => {
    if (!duration) {
      return '--:--.--'
    } else {
      const minutes = Math.floor(duration / 60)
      const minutesNorm = (minutes < 99 ? minutes : 99).toString()
      const minutesStr = minutesNorm.length === 2 ? minutesNorm : '0' + minutesNorm
      const seconds = Math.floor(duration % 60).toString()
      const secondsStr = seconds.length === 2 ? seconds : '0' + seconds
      const millisStr = (duration % 1).toFixed(3).slice(2)
      return `${minutesStr}:${secondsStr}.${millisStr}`
    }
  }

  renderTitle = ({ id, title }) => (
    <InfoItemContainer>
      <EditableItem
        label={`Case: #${id}`}
        initialValue={title}
        onEdit={val => this.props.onFieldEdit({ title: val })}
      />
    </InfoItemContainer>
  )

  renderUnitName = unitItem => <InfoItemRow label='Unit name:' value={unitItem.name} />

  renderUnitDescription = unitItem => <InfoItemRow label='Unit description:' value={unitItem.description} />

  renderStatusLine = ({ status }, { status: statusDef }) => {
    const { immediateStatusVal } = this.state
    return (
      <InfoItemContainer>
        <EditableItem
          label='Status:'
          initialValue={status}
          selectionList={
            statusDef.values
              .find(({ name }) => name === immediateStatusVal)['can_change_to']
              .map(({ name }) => name)
              .concat([immediateStatusVal])
          }
          onEdit={this.handleStatusEdit}
        />
      </InfoItemContainer>
    )
  }

  renderCategoriesLine = ({ category, subCategory }, fieldValues) => (
    <InfoItemContainer>
      <div className='flex'>
        <div className='flex-grow'>
          <EditableItem
            label='Category:'
            initialValue={category}
            selectionList={fieldValues.category.values.map(({ name }) => name)}
            onEdit={val => this.props.onFieldEdit({
              category: val,
              subCategory: fieldValues.subCategory.values[0].name
            })}
          />
        </div>
        <div className='flex-grow ml2'>
          <EditableItem
            label='Sub-Category:'
            initialValue={subCategory}
            selectionList={fieldValues.subCategory.values
              .filter(
                ({ name, visibility_values: [relatedCategory] }) => (relatedCategory === category || !relatedCategory)
              )
              .map(({ name }) => name)
            }
            onEdit={val => this.props.onFieldEdit({ subCategory: val })}
          />
        </div>
      </div>
    </InfoItemContainer>
  )

  renderPrioritySeverityLine = ({ priority, severity }, fieldValues) => (
    <InfoItemContainer>
      <div className='flex'>
        <div className='flex-grow'>
          <EditableItem
            label='Priority:'
            initialValue={priority}
            selectionList={fieldValues.priority.values.map(({ name }) => name)}
            onEdit={val => this.props.onFieldEdit({ priority: val })}
          />
        </div>
        <div className='flex-grow ml2'>
          <EditableItem
            label='Severity:'
            initialValue={severity}
            selectionList={fieldValues.severity.values.map(({ name }) => name)}
            onEdit={val => this.props.onFieldEdit({ severity: val })}
          />
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

  renderAssignedTo = (assignedUser, normalizedUnitUsers, pendingInvitations, isUnitOwner, unitRoleType) => {
    const { match, invitationState, onResetInvitation, onNewUserAssigned, onExistingUserAssigned } = this.props
    const { chosenAssigned } = this.state
    const pendingUsers = pendingInvitations.map(inv => {
      const { bugzillaCreds: { login }, profile: { name }, emails: [{ address: email }] } = inv.inviteeUser()
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

    const usersClassifications = normalizedUnitUsers.reduce((classes, user) => {
      if (user.login === resolvedAssignedUser.login) {
        classes.assignee = user
      } else if (user.isDefaultAssignee) {
        classes.defaultRoleAssignees.push(user)
      } else {
        classes.otherRoleMembers.push(user)
      }

      return classes
    }, {
      assignee: null,
      defaultRoleAssignees: [],
      otherRoleMembers: []
    })
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
          {...{ invitationState, onResetInvitation, isUnitOwner, unitRoleType }}
          onNewUserInvited={onNewUserAssigned}
          basePath={match.url} relPath='assign'
          title='Who should be assigned?'
          linkLabelForNewUser='Invite a new assignee'
          mainOperationText='Assign case'
          disableMainOperation={!chosenAssigned || chosenAssigned.login === resolvedAssignedUser.login}
          onMainOperation={() => onExistingUserAssigned(chosenAssigned)}
          additionalOperationText='Assign to someone else'
          potentialInvitees={normalizedUnitUsers.concat(pendingUsers.map(u => Object.assign({ pending: true }, u)))}
          selectControlsRenderer={() => (
            <AssigneeSelectionList
              currentAssignee={usersClassifications.assignee}
              defaultAssignees={usersClassifications.defaultRoleAssignees}
              otherUsers={usersClassifications.otherRoleMembers}
              currentSelectedUser={resolvedChosenAssigned}
              onUserClicked={user => this.setState({ chosenAssigned: user })}
            />
          )}
        />
      </InfoItemContainer>
    )
  }

  renderPeopleInvolved = (
    caseItem, unitItem, { creator, assignee, subscribed }, normalizedUnitUsers, pendingInvitations,
    successAdded, addUsersError, isUnitOwner, unitRoleType
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
          className='mt2 link outline-0 db'>
          <AddUserControlLine instruction='Invite users to case' />
        </Link>
        <InviteDialog
          {...{ onNewUserInvited, invitationState, isUnitOwner, unitRoleType }}
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
          selectControlsRenderer={({ users, inputRefFn }) => (
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
    const { match, dispatch } = this.props
    return (
      <div className='bt bw3 b--very-light-gray'>
        <div className='pl3 mt2 fw5 silver'>
          FOLLOW UP
        </div>
        {renderEditableTargetAttribute({
          attrName: 'Solution',
          value: solution,
          targetDate: solutionDeadline && new Date(solutionDeadline),
          editUrl: `${match.url}/solution`
        })}
        <Route path={`${match.url}/solution`} children={({ match: subMatch }) => (
          <CaseTargetAttrDialog
            show={!!subMatch}
            attrName='Solution'
            initialValue={solution}
            initialDate={solutionDeadline && new Date(solutionDeadline)}
            onSubmit={(value, date) => {
              this.props.onFieldEdit({
                solution: value,
                solutionDeadline: moment(date).format('YYYY-MM-DD')
              })
              dispatch(goBack())
            }}
            onCancel={() => {
              dispatch(goBack())
            }}
          />
        )} />
        {renderEditableTargetAttribute({
          attrName: 'Next steps',
          value: nextSteps,
          targetDate: nextStepsBy && new Date(nextStepsBy),
          editUrl: `${match.url}/nextSteps`
        })}
        <Route path={`${match.url}/nextSteps`} children={({ match: subMatch }) => (
          <CaseTargetAttrDialog
            show={!!subMatch}
            attrName='Next Steps'
            initialValue={nextSteps}
            initialDate={nextStepsBy && new Date(nextStepsBy)}
            onSubmit={(value, date) => {
              this.props.onFieldEdit({
                nextSteps: value,
                // nextStepsBy: date.toISOString().slice(0, -5) + 'Z' // Broken
                nextStepsBy: moment(date).format('YYYY-MM-DD')
              })
              dispatch(goBack())
            }}
            onCancel={() => {
              dispatch(goBack())
            }}
          />
        )} />
      </div>
    )
  }

  render () {
    const { caseItem, comments, unitItem, caseUserTypes, pendingInvitations, caseUsersState, userId, userBzLogin, caseFieldValues } = this.props
    const { normalizedUnitUsers } = this.state
    let successfullyAddedUsers, addUsersError
    if (parseInt(caseUsersState.caseId) === parseInt(caseItem.id)) {
      successfullyAddedUsers = caseUsersState.added
      addUsersError = caseUsersState.error
    }
    const isUnitOwner = unitItem.metaData().ownerIds && unitItem.metaData().ownerIds.includes(userId)
    const role = normalizedUnitUsers.find(u => u.login === userBzLogin)
    const unitRoleType = role ? role.role : null
    return (
      <div className='flex-grow overflow-auto h-100'>
        {this.renderTitle(caseItem)}
        {this.renderUnitName(unitItem)}
        {this.renderUnitDescription(unitItem)}
        {this.renderStatusLine(caseItem, caseFieldValues)}
        {this.renderCategoriesLine(caseItem, caseFieldValues)}
        {this.renderPrioritySeverityLine(caseItem, caseFieldValues)}
        {this.renderCreatedBy(caseUserTypes.creator)}
        {this.renderAssignedTo(
          caseUserTypes.assignee, normalizedUnitUsers, pendingInvitations, isUnitOwner, unitRoleType
        )}
        {this.renderPeopleInvolved(
          caseItem, unitItem, caseUserTypes, normalizedUnitUsers, pendingInvitations,
          successfullyAddedUsers, addUsersError, isUnitOwner, unitRoleType
        )}
        {this.renderResolutions(caseItem)}
        {this.renderMediaSection(comments)}
      </div>
    )
  }
  renderMediaSection (comments) {
    const {
      audioDurations, playingAudioId, computedAudioMediaItemWidth: audioSize, computedImageMediaItemWidth: imageSize
    } = this.state
    const attachments = comments
      .reduce((all, c) => {
        const type = attachmentTextMatcher(c.text)
        if (type) {
          switch (type) {
            case 'image':
              all.images.push([c.text.split('\n')[1], c.id])
              break
            case 'audio':
              const creatorText = c.creatorUser
                ? (c.creatorUser.profile.name || c.creatorUser.emails[0].address.split('@')[0])
                : c.creator.split('@')[0]
              all.audio.push([c.text.split('\n')[1], c.id, creatorText])
          }
        }

        return all
      }, { images: [], audio: [] })
    // const size = this.state.computedMediaItemWidth
    return (
      <div className='bt bw3 b--light-gray'>
        {Object.keys(attachments).some(attType => attachments[attType].length > 0) && (
          <div>
            <div className='pl3 mt2 fw5 silver'>
              ATTACHMENTS
            </div>
            {attachments.images.length > 0 && (
              <InfoItemContainer>
                {infoItemLabel(`Images (${attachments.images.length})`)}
                <div className='mv2 grid col3-1fr gap1 flow-row' ref={el => { this.imageMediaContainer = el }}>
                  {attachments.images.map(([url, id], ind) => (
                    <img
                      className='overflow-hidden'
                      src={imageSize && fitDimensions(url, imageSize, imageSize)}
                      width={imageSize} height={imageSize} alt={url} key={ind}
                      onClick={() => this.props.onSelectAttachment(id)}
                    />
                  ))}
                </div>
              </InfoItemContainer>
            )}
            {attachments.audio.length > 0 && (
              <InfoItemContainer>
                {infoItemLabel(`Voice Memos (${attachments.audio.length})`)}
                <div className='mv2 grid col3-1fr gap1 flow-row' ref={el => { this.audioMediaContainer = el }}>
                  {attachments.audio.map(([url, id, creatorText], ind) => (
                    <div
                      key={ind}
                      className='bg-very-light-gray ba b--gray-93 flex flex-column items-center justify-center relative'
                      style={{ width: audioSize + 'px', height: audioSize + 'px' }}
                      onClick={() => this.handleAudioAttachmentClicked(id)}
                    >
                      {playingAudioId === id && (
                        <div className='absolute bg-black-70 left-0 top-0 bottom-0 right-0 flex items-center justify-center'>
                          <FontIcon className='material-icons' style={{ fontSize: '28px' }} color='#fff'>pause</FontIcon>
                        </div>
                      )}
                      <FontIcon className='material-icons' color='#555'>keyboard_voice</FontIcon>
                      <div className='mt1 f7 mid-gray fw5'>
                        {creatorText}
                      </div>
                      <div className='mt1 flex items-center pr1'>
                        <FontIcon
                          className={'material-icons' + (playingAudioId === id ? ' o-0' : '')}
                          style={{ fontSize: 16 }}
                          color='#555'
                        >
                          play_arrow
                        </FontIcon>
                        <div className='ml1 f7 mid-gray'>{this.formatAudioDuration(audioDurations[id.toString()])}</div>
                      </div>
                      <audio
                        src={url}
                        onLoadedMetadata={evt => this.handleAudioMetaDataLoaded(evt, id)}
                        ref={el => this.handleAudioRef(el, id)}
                      />
                    </div>
                  ))}
                </div>
              </InfoItemContainer>
            )}
          </div>
        )}
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
  caseUsersState: PropTypes.object.isRequired,
  pendingInvitations: PropTypes.array,
  userBzLogin: PropTypes.string.isRequired,
  caseFieldValues: PropTypes.object.isRequired
}

export default connect(() => ({}))(withRouter(CaseDetails))
