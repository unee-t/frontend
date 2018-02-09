import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link, withRouter } from 'react-router-dom'
import FontIcon from 'material-ui/FontIcon'
import _ from 'lodash'
import moment from 'moment'
import themes from '../components/user-themes.mss'
import UserAvatar from '../components/user-avatar'
import { attachmentTextMatcher } from '../../util/matchers'
import { fitDimensions } from '../../util/cloudinary-transformations'
import InviteDialog from '../components/invite-dialog'

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

const userInfoItem = (user, theme) => (
  <div key={user.login} className={theme + ' flex pt2'}>
    <UserAvatar user={user} />
    <div className='ml2 pl1 flex-grow overflow-hidden'>
      <div className='mid-gray ellipsis'>{user.name || user.login}</div>
      <div className='mt1 f7 gray ellipsis'>{user.role || 'Administrator'}</div>
    </div>
  </div>
)

const mediaItemsPadding = 4 // Corresponds with the classNames set to the media items
const mediaItemRowCount = 3

class CaseDetails extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      filterString: ''
    }
  }
  componentDidMount () {
    this.setState({
      computedMediaItemWidth: Math.round((this.refs.media.clientWidth - (2 * mediaItemsPadding)) / mediaItemRowCount)
    })
  }

  renderSummaryLine = ({id, summary}) => infoItemRow(`Case: #${id}`, summary)

  renderUnitName = unitItem => infoItemRow('Unit name:', unitItem.name)

  renderUnitDescription = unitItem => infoItemRow('Unit description:', unitItem.description)

  renderStatusLine = ({status}) => infoItemRow('Status:', status)

  renderCategoriesLine = ({rep_platform: category, cf_ipi_clust_6_claim_type: subCategory}) => (
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

  renderAssignedTo = user => (
    <InfoItemContainer>
      {infoItemLabel('Assigned to:')}
      {userInfoItem(user, themes.theme2)}
    </InfoItemContainer>
  )

  renderPeopleInvolved = ({creator, assigned, subscribed}, unitUsers, pendingInvitations) => {
    const {
      match, onRoleUserAdded, onNewUserInvited, invitationState, onResetInvitation, onRoleUserRemoved
    } = this.props
    const pendingUsers = pendingInvitations.map(inv => {
      const { bugzillaCreds: { login }, profile: { name } } = inv.inviteeUser()
      return {
        name,
        login,
        role: inv.role
      }
    })
    return (
      <InfoItemContainer>
        {infoItemLabel('People involved:')}
        {subscribed.map((user, ind) => userInfoItem(user, themes['theme' + ((ind + 2) % 10 + 1)]))}
        {pendingUsers.map((user, ind) => userInfoItem(user, themes['theme' + ((ind + 2 + subscribed.length) % 10 + 1)]))}
        <Link to={`${match.url}/invite`}
          className='mt2 link flex items-center outline-0'>
          <div className={themes.sized + ' br-100 ba b--moon-gray bg-transparent tc'}>
            <FontIcon className='material-icons' style={addPersonIconStyle}>person_add</FontIcon>
          </div>
          <div className='ml2 pl1 bondi-blue'>Invite or remove users</div>
        </Link>
        <InviteDialog
          basePath={match.url} relPath='invite'
          potentialInvitees={unitUsers.filter(u => u.login !== creator.login && u.login !== assigned.login)}
          pendingInvitees={pendingUsers}
          invitedUserEmails={subscribed.map(u => u.login)}
          {...{onRoleUserAdded, onNewUserInvited, invitationState, onResetInvitation, onRoleUserRemoved}}
        />
      </InfoItemContainer>
    )
  }

  renderResolutions = (
    {
      cf_ipi_clust_1_next_step: nextSteps,
      cf_ipi_clust_1_next_step_by: nextStepBy,
      cf_ipi_clust_1_solution: solution,
      deadline
    }
  ) => (
    <div className='bt bw3 b--very-light-gray'>
      {solution && (
        <InfoItemContainer>
          {infoItemMembers('Solution', solution)}
          {deadline && (
            <div className='mt2 f7 warn-crimson b'>
              Deadline: {moment(deadline).format('D MMM YYYY, h:mm')} hrs
            </div>
          )}
        </InfoItemContainer>
      )}
      {nextSteps && (
        <InfoItemContainer>
          {infoItemMembers('Next steps:', nextSteps)}
          {deadline && (
            <div className='mt2 f7 warn-crimson b'>
              Deadline: {moment(nextStepBy).format('D MMM YYYY, h:mm')} hrs
            </div>
          )}
        </InfoItemContainer>
      )}
    </div>
  )

  render () {
    const { caseItem, comments, unitUsers, unitItem, caseUserTypes, pendingInvitations } = this.props
    return (
      <div className='flex-grow overflow-auto'>
        {this.renderSummaryLine(caseItem)}
        {this.renderUnitName(unitItem)}
        {this.renderUnitDescription(unitItem)}
        {this.renderStatusLine(caseItem)}
        {this.renderCategoriesLine(caseItem)}
        {this.renderCreatedBy(caseUserTypes.creator)}
        {this.renderAssignedTo(caseUserTypes.assigned)}
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
  onResetInvitation: PropTypes.func.isRequired,
  unitUsers: PropTypes.array.isRequired,
  invitationState: PropTypes.object.isRequired,
  caseUserTypes: PropTypes.object.isRequired,
  pendingInvitations: PropTypes.array
}

export default withRouter(CaseDetails)
