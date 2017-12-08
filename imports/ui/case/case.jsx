import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import moment from 'moment'
import { Meteor } from 'meteor/meteor'
import Cases from '../../api/cases'
import Comments from '../../api/comments'
import AppBar from 'material-ui/AppBar'
import Subheader from 'material-ui/Subheader'
import IconButton from 'material-ui/IconButton'
import SvgIcon from 'material-ui/SvgIcon'
import FontIcon from 'material-ui/FontIcon'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import ContentAdd from 'material-ui/svg-icons/content/add'
import Preloader from '../preloader/preloader'
import colors from '../../mui-theme/colors'
import actions from './case.actions'

import styles from './case.mss'
import {
  logoIconStyle,
  logoButtonStyle,
  subheaderStyle,
  titleStyle,
  moreVertIconColor,
  attachmentIconStyle,
  attachmentButtonStyle,
  sendIconStyle
} from './case.mui-styles'

const UneeTIcon = (props) => (
  <SvgIcon {...props} viewBox='3 3 39 39'>
    <use xlinkHref='/unee-t_logo_reverse.svg#icon' />
  </SvgIcon>
)

export class Case extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      message: ''
    }
  }

  componentDidUpdate (prevProps) {
    const { comments } = this.props

    // Scrolling down to the latest message, if the messages were already rendered, and a comment has been added
    if (this.refs.messages && prevProps.comments.length !== comments.length) {
      this.refs.messages.scrollTop = this.refs.messages.scrollHeight
    }
  }

  render () {
    const { caseItem, comments, loadingCase, caseError } = this.props
    if (caseError) return <h1>{caseError.error.message}</h1>
    if (loadingCase) return <Preloader />

    return (
      <div className='flex flex-column full-height roboto'>
        {this.renderTitle(caseItem)}
        {this.renderMessages(comments)}
        {this.renderInputControls(caseItem)}
      </div>
    )
  }

  handleMessageInput (evt) {
    this.setState({
      message: evt.target.value
    })
  }

  handleCreateMessage (evt) {
    const { createComment } = actions
    evt.preventDefault()
    this.props.dispatch(createComment(this.state.message, this.props.match.params.caseId))

    // Clearing the input
    this.setState({
      message: ''
    })
  }

  renderTitle ({ summary, product }) {
    return (
      <div>
        <AppBar title={product}
          titleStyle={titleStyle}
          iconElementLeft={
            <IconButton iconStyle={logoIconStyle} style={logoButtonStyle}>
              <UneeTIcon />
            </IconButton>
          }
        />
        <Subheader style={subheaderStyle} className='flex'>
          <div className='flex-grow ellipsis' title={summary}>{summary}</div>
          <div>
            <IconButton>
              <FontIcon className='material-icons' color={moreVertIconColor}>more_vert</FontIcon>
            </IconButton>
          </div>
        </Subheader>
      </div>
    )
  }

  renderMessages (comments) {
    let lastDay = comments.length && comments[0].creation_time.slice(0, 10)
    let currKey = 0
    return (
      <div className={[styles.messagesContainer, 'flex-grow', 'overflow-auto'].join(' ')} ref='messages'>
        {comments.slice(1).reduce((listItems, comment) => { // Rendering all starting from the second
          const currDay = comment.creation_time.slice(0, 10)

          // Checking if the day of this message is different than the previous
          if (currDay !== lastDay) {
            lastDay = currDay

            // Creating a day label
            listItems.push(this.renderDayLabel(comment, currKey++))
          }

          // Creating a message item
          listItems.push(this.renderSingleMessage(comment, currKey++))
          return listItems
        }, [ // Rendering the first day label and message
          comments.length ? this.renderDayLabel(comments[0], currKey++) : '',
          comments.length ? this.renderSingleMessage(comments[0], currKey++) : ''
        ])}
      </div>
    )
  }

  renderDayLabel ({creation_time}, key) {
    const generalFormat = 'MMMM DD'
    const dayString = moment(creation_time).calendar(null, {
      sameDay: '[Today]',
      lastDay: '[Yesterday]',
      lastWeek: generalFormat,
      sameElse: function (now) {
        return (this.diff(now, 'years') > -1) ? generalFormat : generalFormat + ', YYYY'
      }
    })
    return (
      <div className='tc mt3 mb2' key={key}>
        <span className='br-pill bg-gray ph3 lh-dbl f7 white dib'>{dayString}</span>
      </div>
    )
  }

  renderSingleMessage ({creator, text, creation_time}, key) {
    const isSelf = this.props.userEmail === creator
    return (
      <div className={'mb3' + (isSelf ? ' tr' : '')} key={key}>
        { !isSelf ? (
          <div className={[styles.messageAvatar, 'dib ml2 v-btm br-100 tc white'].join(' ')}>
            {creator.slice(0, 1).toUpperCase()}
          </div>
        ) : ''}
        <div className={[styles.messageBox, isSelf ? 'bg-rad-green' : 'bg-white', 'cf br3 pt2 pl3 pr2 mh2 dib tl'].join(' ')}>
          { !isSelf ? (
            <div className={[styles.messageCreator, 'f6'].join(' ')}>{creator}</div>
          ) : ''}
          <span className='f5 mr3'>{text}</span>
          <div className={[styles.messageTime, 'fr', 'f7'].join(' ')}>
            {moment(creation_time).format('HH:mm')}
          </div>
        </div>
      </div>
    )
  }

  renderInputControls () {
    return (
      <div className={[styles.inputRow, 'flex items-center'].join(' ')}>
        <IconButton iconStyle={attachmentIconStyle} style={attachmentButtonStyle}>
          <ContentAdd color={colors.main} />
        </IconButton>
        <input type='text' placeholder='Type your response'
          onChange={this.handleMessageInput.bind(this)} value={this.state.message}
          className='input-reset bg-white br-pill ba b--moon-gray lh-input h2 ph3 dib flex-grow outline-0' />
        <div className='mh2'>
          <FloatingActionButton mini zDepth={0} iconStyle={sendIconStyle}
            onClick={this.handleCreateMessage.bind(this)} disabled={this.state.message === ''}>
            <FontIcon className='material-icons'>send</FontIcon>
          </FloatingActionButton>
        </div>
      </div>
    )
  }
}

Case.propTypes = {
  loadingCase: PropTypes.bool,
  caseError: PropTypes.object,
  caseItem: PropTypes.object,
  loadingComments: PropTypes.bool,
  commentsError: PropTypes.object,
  comments: PropTypes.array,
  userEmail: PropTypes.string
}

let caseError, commentsError
const CaseContainer = createContainer(props => {
  const { caseId } = props.match.params
  const caseHandle = Meteor.subscribe('case', caseId, {
    onStop: (error) => {
      caseError = error
    }
  })
  const commentsHandle = Meteor.subscribe('caseComments', caseId, {
    onStop: (error) => {
      commentsError = error
    }
  })

  return {
    loadingCase: !caseHandle.ready(),
    caseError,
    caseItem: Cases.findOne(caseId),
    loadingComments: !commentsHandle.ready(),
    commentsError,
    comments: Comments.find({bug_id: parseInt(caseId)}).fetch(),
    userEmail: Meteor.user() ? Meteor.user().emails[0].address : null
  }
}, Case)

function mapStateToProps () {
  return {
  }
}

export default connect(mapStateToProps)(CaseContainer)
