/* global FileReader */

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import Subheader from 'material-ui/Subheader'
import IconButton from 'material-ui/IconButton'
import FontIcon from 'material-ui/FontIcon'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import ContentAdd from 'material-ui/svg-icons/content/add'
import CircularProgress from 'material-ui/CircularProgress'
import { formatDayText } from '../../util/formatters'
import { matchWidth } from '../../util/cloudinary-transformations'
import { attachmentTextMatcher } from '../../util/matchers'
import UserAvatar from '../components/user-avatar'

import styles from './case.mss'
import themes from '../components/user-themes.mss'
import colors from '../../mui-theme/colors'
import {
  subheaderStyle,
  infoIconStyle,
  attachmentButtonStyle,
  retryButtonStyle,
  replayIconColor,
  sendIconStyle
} from './case.mui-styles'

const messagePercentWidth = 0.6 // Corresponds with width/max-width set to the text and image message containers

const additionalSubHeader = (label, info, onClick, lastIndex) => (
  <Subheader className='bt b--gray-93 pv2 ph3' key={lastIndex + 1}>
    <div className='pl2 bl bw1 b--bitter-lemon'>
      <div className='strong-cerulean f7 lh-title mv1'>{label}</div>
      <div className='lh-title mt1 mb2 flex'>
        <div className='ellipsis mid-gray flex-grow'>{info}</div>
        <a className='moon-gray' onClick={onClick}>More</a>
      </div>
    </div>
  </Subheader>
)

class CaseMessages extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      message: '',
      previewImage: ''
    }
  }

  componentDidMount () {
    this.scrollToBottom()
    this.setState({computedMessageWidth: Math.round(this.refs.messages.offsetWidth * messagePercentWidth)})
  }

  componentDidUpdate (prevProps) {
    const { comments, attachmentUploads } = this.props

    // Scrolling down to the latest message, if the messages were already rendered, and a comment has been added
    if ((prevProps.comments.length !== comments.length ||
      prevProps.attachmentUploads.length !== attachmentUploads.length)) {
      this.scrollToBottom()
    }
  }

  scrollToBottom () {
    this.refs.messages.scrollTop = this.refs.messages.scrollHeight
  }

  handleMessageInput (evt) {
    this.setState({
      message: evt.target.value
    })
  }

  handleCreateMessage (evt) {
    evt.preventDefault()

    if (this.state.previewImage) {
      this.props.onCreateAttachment(this.state.previewImage, this.imageFile)
      this.handleRemovePreview()
    } else {
      this.props.onCreateComment(this.state.message)

      // Clearing the input
      this.setState({
        message: ''
      })
    }
  }

  handleRetryUpload (evt, process) {
    evt.preventDefault()

    this.props.onRetryAttachment(process)
  }

  handleFileSelection (evt) {
    evt.persist()
    const file = evt.target.files[0]
    const reader = new FileReader()
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
    const { caseItem, comments, attachmentUploads } = this.props
    return (
      <div className='flex flex-column flex-grow roboto overflow-hidden'>
        {this.renderTitle(caseItem)}
        {this.renderMessages(comments, attachmentUploads)}
        {this.renderInputControls(caseItem)}
      </div>
    )
  }

  renderTitle ({ id, priority, cf_ipi_clust_1_next_step: nextSteps, cf_ipi_clust_1_solution: solution }) {
    const subheaderBoxClasses = 'flex-grow tc b--gray-93'
    const additionalSubheaders = []
    if (nextSteps) {
      additionalSubheaders.push(additionalSubHeader('Next steps', nextSteps, this.props.onMoreInfo, additionalSubheaders.length))
    }
    if (solution) {
      additionalSubheaders.push(additionalSubHeader('Solution', solution, this.props.onMoreInfo, additionalSubheaders.length))
    }
    return [
      (<Subheader style={subheaderStyle} className='flex' key='0'>
        <div className={subheaderBoxClasses + ' br'}>Issue: #{id}</div>
        <div className={subheaderBoxClasses + ' br'}>Priority: {priority}</div>
        <div className={subheaderBoxClasses + ' flex items-center justify-center'} onClick={this.props.onMoreInfo}>
          <FontIcon className='material-icons' style={infoIconStyle}>info</FontIcon>More info
        </div>
      </Subheader>)
    ].concat(additionalSubheaders)
  }

  renderMessages (comments, uploads) {
    const messageList = comments.concat(uploads.map(process => ({
      creation_time: (new Date()).toISOString(),
      creator: this.props.userEmail,
      text: '[!attachment]\n' + process.preview,
      process
    })))
    let lastDay = ''
    let currKey = 0
    this.creators = []
    return (
      <div className={[styles.messagesContainer, 'flex-grow', 'overflow-auto'].join(' ')} ref='messages'>
        {messageList.reduce((listItems, comment) => { // Rendering all starting from the second
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
        }, [])}
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

  renderSingleMessage ({creator, text, creation_time, process, id}, key) {
    const isSelf = this.props.userEmail === creator
    const contentRenderer = attachmentTextMatcher(text)
      ? this.renderMessageImageContent.bind(this)
      : this.renderMessageTextContent.bind(this)
    let themeClass
    if (!isSelf) {
      let creatorIndex = this.creators.indexOf(creator)
      if (creatorIndex === -1) {
        this.creators.push(creator)
        creatorIndex = this.creators.length - 1
      }
      themeClass = themes['theme' + ((creatorIndex % 10) + 1)]
    }
    return (
      <div className={['mb3' + (isSelf ? ' tr' : ''), themeClass || ''].join(' ')} key={key}>
        { !isSelf ? (
          <UserAvatar creator={creator} />
        ) : ''}
        { contentRenderer(isSelf, creator, text, creation_time, id, process) }
      </div>
    )
  }

  renderMessageTextContent (isSelf, creator, text, creationTime) {
    return (
      <div className={'mw-60 cf br3 pt2 pl3 pr2 mh2 dib tl ' + (isSelf ? 'bg-rad-green' : 'bg-white')}>
        { !isSelf ? (
          <div className={themes.creatorText + ' f6 ellipsis'}>{creator}</div>
        ) : ''}
        <span className='f5 mr3'>{text}</span>
        <div className={styles.messageTime + ' fr f7'}>
          {moment(creationTime).format('HH:mm')}
        </div>
      </div>
    )
  }

  renderMessageImageContent (isSelf, creator, text, creationTime, id, process) {
    const attachmentUrl = text.split('\n')[1]
    const { computedMessageWidth } = this.state
    const thumbUrl = computedMessageWidth && matchWidth(attachmentUrl, computedMessageWidth)
    return (
      <div className={
        'w-60 br3 mh2 dib tc overflow-hidden h4 bg-white relative inline-flex items-center' + (isSelf ? ' ml-auto' : '')
      } onClick={() => !process && this.props.onThumbClicked(id)}>
        {thumbUrl && (
          <img className='w-100 absolute' src={thumbUrl} alt={attachmentUrl} />
        )}
        <div className='fr f7 white absolute bottom-0 right-0 lh-dbl pr2'>
          {moment(creationTime).format('HH:mm')}
        </div>
        {!!process && (
          <div className='w-100 tc'>
            <div className='relative dib bg-black-20 br-100'>
              {process.error ? (
                <IconButton style={retryButtonStyle} onClick={evt => this.handleRetryUpload(evt, process)}>
                  <FontIcon className='material-icons' color={replayIconColor}>refresh</FontIcon>
                </IconButton>
              ) : process.percent ? (
                <CircularProgress
                  size={40} thickness={5} mode='determinate' value={process.percent} />
              ) : (
                <div className='dib'>
                  <CircularProgress
                    size={40} thickness={5} mode='indeterminate' />
                </div>
              )}
            </div>
            {!!process.errorMessage && (
              <div className='relative'>
                <div className='bg-black-30 br-pill f7 white dib ph2'>
                  {process.errorMessage}
                </div>
              </div>
            )}
          </div>
        )}
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

CaseMessages.propTypes = {
  caseItem: PropTypes.object.isRequired,
  comments: PropTypes.array.isRequired,
  attachmentUploads: PropTypes.array.isRequired,
  userEmail: PropTypes.string.isRequired,
  onCreateComment: PropTypes.func.isRequired,
  onCreateAttachment: PropTypes.func.isRequired,
  onRetryAttachment: PropTypes.func.isRequired,
  onThumbClicked: PropTypes.func.isRequired,
  onMoreInfo: PropTypes.func
}

export default CaseMessages
