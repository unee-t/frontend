import React, { Component } from 'react'
import PropTypes from 'prop-types'
import FontIcon from 'material-ui/FontIcon'
import _ from 'lodash'
import moment from 'moment'
import themes from '../components/user-themes.mss'
import UserAvatar from '../components/user-avatar'
import Dialog from 'material-ui/Dialog'
import { attachmentTextMatcher } from '../../util/matchers'
import { fitDimensions } from '../../util/cloudinary-transformations'

import {
  detailLineIconColor,
  addPersonIconStyle,
  closeDialogButtonStyle,
  modalTitleStyle,
  modalCustomContentStyle,
  modalBodyStyle
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
      dialogOpen: false,
      filterString: ''
    }
  }
  componentDidMount () {
    this.setState({
      computedMediaItemWidth: Math.round((this.refs.media.clientWidth - (2 * mediaItemsPadding)) / mediaItemRowCount)
    })
  }
  componentDidUpdate (prevProps, prevState) {
    if (this.state.dialogOpen && !prevState.dialogOpen) {
      setTimeout(() => { // Had to set timeout as the dialog doesn't create the content immediately
        this.searchFilter.focus()
      }, 500)
    }
  }
  handleAddPerson = () => {
    this.setState({
      dialogOpen: true
    })
  }
  handleFilterChange = evt => {
    this.setState({
      filterString: evt.target.value
    })
  }
  handleCloseDialog = () => {
    this.setState({
      dialogOpen: false
    })
  }
  renderParticipants = (comments, unitUsers, caseItem) => {
    // TODO: Refactor this to use case's CC, assigned_to and reporter fields (actual field names may differ)
    const participants = _.chain(comments).map('creator').uniq().value()
    const matcher = this.state.filterString ? new RegExp(this.state.filterString, 'i') : null
    const filteredUsers = unitUsers ? unitUsers.reduce((all, user, idx) => {
      if (!matcher || (user.name && user.name.match(matcher)) || user.email.match(matcher)) {
        all.push(Object.assign({origIdx: idx, alreadyInvited: caseItem.cc.includes(user.email)}, user))
      }
      return all
    }, []).sort((a, b) => {
      if (a.alreadyInvited && !b.alreadyInvited) {
        return 1
      } else if (b.alreadyInvited && !a.alreadyInvited) {
        return -1
      } else {
        return 0
      }
    }) : []
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
            <button className='button-reset h2 w2 br-100 ba b--moon-gray bg-transparent outline-0 dim'
              onClick={this.handleAddPerson}>
              <FontIcon className='material-icons' style={addPersonIconStyle}>person_add</FontIcon>
            </button>
            <Dialog
              title='Who would you like to invite?'
              titleStyle={modalTitleStyle}
              modal
              open={this.state.dialogOpen}
              contentStyle={modalCustomContentStyle}
              bodyStyle={modalBodyStyle}
            >
              <button className='button-reset b--none bg-transparent absolute top-1 pt2 right-1 outline-0'
                onClick={this.handleCloseDialog}>
                <FontIcon className='material-icons' style={closeDialogButtonStyle}>close</FontIcon>
              </button>
              <div className='flex no-shrink'>
                <input placeholder='Enter the name or email' ref={input => { this.searchFilter = input }}
                  className='input-reset ba b--moon-gray outline-0 lh-dbl mb2 ti3 flex-grow'
                  value={this.state.filterString} onChange={this.handleFilterChange} />
              </div>
              <div className='ba b--moon-gray flex-grow'>
                <div className='h5 overflow-auto pb2'>
                  {!!filteredUsers.length && (
                    <ul className='list mv0 pa0 pt1'>
                      {filteredUsers.map(user => (
                        <li key={user.email}
                          className={
                            themes['theme' + ((user.origIdx % 10) + 1)] + ' flex pv2 ph2 ' +
                              (user.alreadyInvited ? 'bg-light-gray' : 'dim')
                          }
                          onClick={() => { !user.alreadyInvited && this.props.onUserInvited(user) }}>
                          <div className='ml1'>
                            <UserAvatar creator={user.name || user.email} />
                          </div>
                          <div className='ml2 flex-grow'>
                            <div className='f5 bondi-blue'>{user.name || user.email}</div>
                            <div className='f6 gray'>{user.role}</div>
                          </div>
                          {user.alreadyInvited && (
                            <div className='ml2 flex flex-column items-center justify-center'>
                              <FontIcon className='material-icons' color='green'>check_circle</FontIcon>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className='ph3'>
                    {filteredUsers.length ? (
                      <p className='tc i mid-gray'>Can't find who you're looking for?</p>
                    ) : (
                      <p className='tc i warn-crimson'>We couldn't find any users with the name entered.</p>
                    )}
                    <button className='button-reset bg-bondi-blue white br1 b--none pv2 lh-title w-100 dim'>
                      Invite a new user
                    </button>
                  </div>
                </div>
              </div>
            </Dialog>
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
  onSelectAttachment: PropTypes.func,
  onUserInvited: PropTypes.func,
  unitUsers: PropTypes.array
}

export default CaseDetails
