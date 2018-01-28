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

const renderSummaryLine = ({summary}) => (
  <div className='pv1 ph3 mv2 mid-gray'>{summary}</div>
)
const renderCaseType = ({cf_ipi_clust_6_claim_type: caseType}) => (
  <div className='bt bb b--gray-93 ph3 gray h2-5 flex items-center'>
    <FontIcon className='material-icons mr4' color={detailLineIconColor}>local_offer</FontIcon>
    <div>{caseType}</div>
  </div>
)

const renderResolutions = ({cf_ipi_clust_1_next_step: nextSteps, cf_ipi_clust_1_solution: solution, deadline: dueDate}) => (
  <div className='bb bt bw4 b--very-light-gray'>
    {[
      [solution, 'Solution', 'mid-gray'],
      [nextSteps, 'Next steps', 'mid-gray'],
      [dueDate, 'Due date', 'b gray', val => moment(val).format('D MMM YYYY')]
    ].reduce((all, [value, label, classes, formatter = _.identity]) => {
      if (value) {
        all.push(
          <div className='bb b--very-light-gray pa3' key={all.length}>
            <div className='f6 bondi-blue mb2'>
              {label}
            </div>
            <div className={classes + ' lh-copy'}>
              {formatter(value)}
            </div>
          </div>
        )
      }
      return all
    }, [])}
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
  renderParticipants = (comments, unitUsers, caseItem) => {
    // TODO: Refactor this to use case's CC, assigned_to and reporter fields (actual field names may differ)
    const participants = _.chain(comments).map('creator').uniq().value()
    const { match, onRoleUserAdded, onNewUserInvited, invitationState, onResetInvitation } = this.props
    return (
      <div className='ph3 h2-5 flex items-center'>
        <FontIcon className='material-icons mr4' color={detailLineIconColor}>person</FontIcon>
        <div className='flex'>
          {participants.map((creator, ind) => (
            <div key={ind} className={themes['theme' + ((ind % 10) + 1)] + ' mr2'}>
              <UserAvatar creator={creator} isSmall />
            </div>
          ))}
          <div>
            <Link to={`${match.url}/invite`}
              className='link h2 w2 br-100 ba b--moon-gray bg-transparent outline-0 dim dib tc'>
              <FontIcon className='material-icons' style={addPersonIconStyle}>person_add</FontIcon>
            </Link>
            <InviteDialog
              basePath={match.url} relPath='invite'
              potentialInvitees={unitUsers}
              invitedUserEmails={caseItem.cc}
              {...{onRoleUserAdded, onNewUserInvited, invitationState, onResetInvitation}}
            />
          </div>
        </div>
      </div>
    )
  }
  render () {
    const { caseItem, comments, unitUsers } = this.props
    return (
      <div className='flex-grow overflow-auto'>
        {renderSummaryLine(caseItem)}
        {renderCaseType(caseItem)}
        {this.renderParticipants(comments, unitUsers, caseItem)}
        {renderResolutions(caseItem)}
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
      <div className='pa2'>
        <div className='f6 bondi-blue ma2'>
          Media
        </div>
        <div className='ma1 grid col3-1fr gap1 flow-row' ref='media'>
          {attachments.map(([url, id], ind) => (
            <img src={size && fitDimensions(url, size, size)} alt={url} key={ind}
              onClick={() => this.props.onSelectAttachment(id)} />
          ))}
        </div>
      </div>
    )
  }
}

CaseDetails.propTypes = {
  caseItem: PropTypes.object.isRequired,
  comments: PropTypes.array.isRequired,
  onSelectAttachment: PropTypes.func.isRequired,
  onRoleUserAdded: PropTypes.func.isRequired,
  onNewUserInvited: PropTypes.func.isRequired,
  onResetInvitation: PropTypes.func.isRequired,
  unitUsers: PropTypes.array.isRequired,
  invitationState: PropTypes.object.isRequired
}

export default withRouter(CaseDetails)
