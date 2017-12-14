/* global FileReader */

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
import { attachmentTextMatcher } from '../../util/matchers'

import styles from './case.mss'
import {
  logoIconStyle,
  logoButtonStyle,
  subheaderStyle,
  titleStyle,
  moreVertIconColor,
  attachmentButtonStyle,
  sendIconStyle
} from './case.mui-styles'

const UneeTIcon = (props) => (
  <SvgIcon {...props} viewBox='3 3 39 39'>
    <use xlinkHref='/unee-t_logo_reverse.svg#icon' />
  </SvgIcon>
)

const formatDayText = time => {
  const generalFormat = 'MMMM DD'
  return moment(time).calendar(null, {
    sameDay: '[Today]',
    lastDay: '[Yesterday]',
    lastWeek: generalFormat,
    sameElse: function (now) {
      return (this.diff(now, 'years') > -1) ? generalFormat : generalFormat + ', YYYY'
    }
  })
}

export class Case extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      message: '',
      previewImage: ''
    }
  }

  componentDidUpdate (prevProps) {
    const { comments } = this.props

    // Scrolling down to the latest message, if the messages were already rendered, and a comment has been added
    if (this.refs.messages && prevProps.comments.length !== comments.length) {
      this.refs.messages.scrollTop = this.refs.messages.scrollHeight
    }
  }

  handleMessageInput (evt) {
    this.setState({
      message: evt.target.value
    })
  }

  handleCreateMessage (evt) {
    const { createComment, createAttachment } = actions
    const caseId = this.props.match.params.caseId
    evt.preventDefault()

    if (this.state.previewImage) {
      this.props.dispatch(createAttachment(
        this.state.previewImage,
        this.imageFile,
        caseId
      ))
      this.handleRemovePreview()
    } else {
      this.props.dispatch(createComment(this.state.message, caseId))

      // Clearing the input
      this.setState({
        message: ''
      })
    }
  }

  handleFileSelection (evt) {
    evt.persist()
    const file = evt.target.files[0]
    let reader = new FileReader()
    reader.onload = (evt) => {
      this.setState({
        previewImage: evt.target.result
      })
    }
    this.imageFile = file
    reader.readAsDataURL(file)
  }

  handleRemovePreview (evt) {
    if (evt) evt.preventDefault()
    this.setState({
      previewImage: ''
    })
    this.imageFile = null
  }

  render () {
    const { caseItem, comments, loadingCase, caseError } = this.props
    if (caseError) return <h1>{caseError.error.message}</h1>
    if (loadingCase) return <Preloader />

    if (this.state.selectedAttachment) {
      return this.renderMaximizedAttachment(this.state.selectedAttachment)
    } else {
      return (
        <div className='flex flex-column full-height roboto'>
          {this.renderTitle(caseItem)}
          {this.renderMessages(comments)}
          {this.renderInputControls(caseItem)}
        </div>
      )
    }
  }

  renderMaximizedAttachment ({creatorText, creationTime, attachmentUrl}) {
    const timeText = `${formatDayText(creationTime)}, ${moment(creationTime).format('HH:mm')}`
    return (
      <div className='flex items-center full-height roboto bg-black'>
        <div className='fixed top-0 w-100 bg-black-20 flex items-center'>
          <IconButton onClick={() => this.setState({selectedAttachment: null})}>
            <FontIcon className='material-icons' color='white'>arrow_back</FontIcon>
          </IconButton>
          <div className='white'>
            <h4 className='mv1'>{creatorText}</h4>
            <h5 className='mv1'>{timeText}</h5>
          </div>
        </div>
        <img className='w-100' src={attachmentUrl} alt='Image failed to load' />
      </div>
    )
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
    const dayString = formatDayText(creation_time)
    return (
      <div className='tc mt3 mb2' key={key}>
        <span className='br-pill bg-gray ph3 lh-dbl f7 white dib'>{dayString}</span>
      </div>
    )
  }

  renderSingleMessage ({creator, text, creation_time}, key) {
    const isSelf = this.props.userEmail === creator
    const contentRenderer = attachmentTextMatcher(text)
      ? this.renderMessageImageContent.bind(this)
      : this.renderMessageTextContent.bind(this)
    return (
      <div className={'mb3' + (isSelf ? ' tr' : '')} key={key}>
        { !isSelf ? (
          <div className={styles.messageAvatar + ' dib ml2 v-btm br-100 tc white'}>
            {creator.slice(0, 1).toUpperCase()}
          </div>
        ) : ''}
        { contentRenderer(isSelf, creator, text, creation_time) }
      </div>
    )
  }

  renderMessageTextContent (isSelf, creator, text, creationTime) {
    return (
      <div className={'mw-60 cf br3 pt2 pl3 pr2 mh2 dib tl ' + (isSelf ? 'bg-rad-green' : 'bg-white')}>
        { !isSelf ? (
          <div className={styles.messageCreator + ' f6'}>{creator}</div>
        ) : ''}
        <span className='f5 mr3'>{text}</span>
        <div className={styles.messageTime + ' fr f7'}>
          {moment(creationTime).format('HH:mm')}
        </div>
      </div>
    )
  }

  renderMessageImageContent (isSelf, creator, text, creationTime) {
    const attachmentUrl = text.split('\n')[1]
    const creatorText = isSelf ? 'You' : creator
    return (
      <div className={
        'w-60 br3 mh2 dib tc overflow-hidden h4 bg-white relative inline-flex items-center' + (isSelf ? ' ml-auto' : '')
      } onClick={() => this.setState({selectedAttachment: {creatorText, creationTime, attachmentUrl}})}>
        <img className='w-100 absolute' src={attachmentUrl} alt={attachmentUrl} />
        <div className='fr f7 white absolute bottom-0 right-0 lh-dbl pr2'>
          {moment(creationTime).format('HH:mm')}
        </div>
      </div>
    )
  }

  renderInputControls () {
    return (
      <div className={[styles.inputRow, 'flex items-center overflow-visible'].join(' ')}>
        <IconButton style={attachmentButtonStyle} onClick={this.state.previewImage ? this.handleRemovePreview.bind(this) : undefined}>
          <label>
            <ContentAdd
              color={this.state.previewImage ? 'red' : colors.main}
              className={this.state.previewImage ? 'rotate-45' : ''} />
            {!this.state.previewImage ? (
              <input type='file' className='dn' onChange={this.handleFileSelection.bind(this)} />
            ) : ''}
          </label>
        </IconButton>
        <div className='flex-grow relative'>
          {this.state.previewImage ? (
            <img className='w-100 absolute bottom--1 br3 shadow-1' src={this.state.previewImage} alt='X' />
          ) : (
            <input type='text' placeholder='Type your response' ref='messageInput'
              onChange={this.handleMessageInput.bind(this)} value={this.state.message}
              className='input-reset bg-white br-pill ba b--moon-gray lh-input h2 ph3 dib outline-0 w-100' />
          )}
        </div>
        <div className='mh2'>
          <FloatingActionButton mini zDepth={0} iconStyle={sendIconStyle}
            onClick={this.handleCreateMessage.bind(this)}
            disabled={this.state.message === '' && this.state.previewImage === ''}>
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
