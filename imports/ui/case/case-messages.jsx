import React, { Component } from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import { Link } from 'react-router-dom'
import Subheader from 'material-ui/Subheader'
import IconButton from 'material-ui/IconButton'
import FontIcon from 'material-ui/FontIcon'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import FlatButton from 'material-ui/FlatButton'
import TextField from 'material-ui/TextField'
import ContentAdd from 'material-ui/svg-icons/content/add'
import { formatDayText } from '../../util/formatters'
import { matchWidth } from '../../util/cloudinary-transformations'
import { attachmentTextMatcher } from '../../util/matchers'
import UserAvatar from '../components/user-avatar'
import FileInput from '../components/file-input'
import UploadPreloader from '../components/upload-preloader'
import { imageInputEventHandler } from '../util/dom-api'
import styles from './case.mss'
import themes from '../components/user-themes.mss'
import colors from '../../mui-theme/colors'
import {
  subheaderStyle,
  infoIconStyle,
  attachmentButtonStyle,
  sendIconStyle,
  addPersonCaseMsg
} from './case.mui-styles'

import {
  whiteTextInputStyle
} from '../components/form-controls.mui-styles'
import ChatBotUI from './chatbot-ui'

const messagePercentWidth = 0.6 // Corresponds with width/max-width set to the text and image message containers

const additionalSubHeader = (label, info, onClick, lastIndex, colorName) => (
  <Subheader className='bt b--gray-93 pv2 ph3' key={lastIndex + 1}>
    <div className={`pl2 bl bw1 b--${colorName}`}>
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
      message: ''
    }
  }

  componentDidMount () {
    this.scrollToBottom()
    this.setState({ computedMessageWidth: Math.round(this.refs.messages.offsetWidth * messagePercentWidth) })
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
    this.props.onCreateComment(this.state.message)

    // Clearing the input
    this.setState({
      message: ''
    })
  }

  render () {
    const { caseItem, comments, attachmentUploads } = this.props
    return (
      <div className='flex flex-column flex-grow roboto overflow-hidden h-100'>
        {this.renderTitle(caseItem)}
        {this.renderMessages(comments, attachmentUploads)}
        {this.renderInputControls()}
      </div>
    )
  }

  renderTitle ({ id, nextSteps, solution }) {
    const additionalSubheaders = []
    if (nextSteps) {
      additionalSubheaders.push(
        additionalSubHeader('Next steps', nextSteps, this.props.onMoreInfo, additionalSubheaders.length, 'bondi-blue')
      )
    }
    if (solution) {
      additionalSubheaders.push(
        additionalSubHeader('Solution', solution, this.props.onMoreInfo, additionalSubheaders.length, 'bitter-lemon')
      )
    }
    return [
      (<Subheader style={subheaderStyle} className='flex bg-white' key='0'>
        <div className='flex-4 flex items-center justify-center'>
          <FlatButton onClick={this.props.onMoreInfo} fullWidth>
            <div className='flex items-center justify-center tc bondi-blue f6'>
              <FontIcon className='material-icons' style={infoIconStyle}>info</FontIcon>More Information
            </div>
          </FlatButton>
        </div>
        <div className='flex-4 flex items-center justify-center br b--gray-93'>
          <FlatButton fullWidth>
            <Link to={`/case/${id}/details/invite`} className='link'>
              <div className='flex items-center justify-center tc bondi-blue f6'>
                <FontIcon className='material-icons' style={addPersonCaseMsg}>person_add</FontIcon> Invite User
              </div>
            </Link>
          </FlatButton>
        </div>
      </Subheader>)
    ].concat(additionalSubheaders)
  }

  renderMessages (comments, uploads) {
    const isCurrentUserCreator = this.props.caseItem.creator === this.props.userBzLogin
    const messageList = comments.concat(uploads.map(process => ({
      'creation_time': (new Date()).toISOString(),
      creator: this.props.userBzLogin,
      text: '[!attachment]\n' + process.preview,
      process
    })))
    let lastDay = ''
    let currKey = 0
    this.creators = []
    const listItems = messageList.reduce((listItems, comment) => { // Rendering all starting from the second
      const currDay = comment['creation_time'].slice(0, 10)
      // Checking if the day of this message is different than the previous
      if (currDay !== lastDay) {
        lastDay = currDay
        // Creating a day label
        listItems.push(this.renderDayLabel(comment, currKey++))
      }
      // Creating a message item
      listItems.push(this.renderSingleMessage(comment, currKey++))
      return listItems
    }, [])
    return (
      <div className={[styles.messagesContainer, 'flex-grow', 'overflow-auto'].join(' ')} ref='messages'>
        { listItems.slice(0, 2)}
        { isCurrentUserCreator &&
          <ChatBotUI
            caseItem={this.props.caseItem}
            handleFileSelection={imageInputEventHandler(this.props.onCreateAttachment)}
            onCreateAttachment={this.props.onCreateAttachment}
          />
        }
        {listItems.slice(2)}
      </div>
    )
  }

  renderDayLabel ({ creation_time: creationTime }, key) {
    const dayString = formatDayText(creationTime)
    return (
      <div className='tc mt3 mb2' key={key}>
        <span className='br-pill bg-gray ph3 lh-dbl f7 white dib'>{dayString}</span>
      </div>
    )
  }

  renderSingleMessage ({ creator, creatorUser, text, creation_time: creationTime, process, id }, key) {
    const isSelf = this.props.userBzLogin === creator
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
      <div className={['mb3 ml2' + (isSelf ? ' tr' : ''), themeClass || ''].join(' ')} key={key}>
        { !isSelf ? (
          <UserAvatar user={{ login: creator }} />
        ) : ''}
        { contentRenderer({ isSelf, creator, creatorUser, text, creationTime, id, process }) }
      </div>
    )
  }

  renderMessageTextContent ({ isSelf, creatorUser, creator, text, creationTime }) {
    // If createUser is unset, i.e. it only has a Bugzilla user and not Meteor user,
    // truncate the email address to show only the local part
    const creatorText = creatorUser ? creatorUser.profile.name : creator.split('@')[0]

    return (
      <div className={'mw-60 cf br3 pt2 pl3 pr2 mh2 dib tl ' + (isSelf ? 'bg-rad-green' : 'bg-white')}>
        { !isSelf ? (
          <div className={themes.creatorText + ' f6 ellipsis'}>{creatorText}</div>
        ) : ''}
        <span className='f5 mr3'>{text}</span>
        <div className={styles.messageTime + ' fr f7'}>
          {moment(creationTime).format('HH:mm')}
        </div>
      </div>
    )
  }

  renderMessageImageContent ({ isSelf, text, creationTime, id, process }) {
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
        {process && (
          <UploadPreloader handleRetryUpload={this.props.onRetryAttachment} process={process} />
        )}
      </div>
    )
  }

  renderInputControls () {
    const { message } = this.state

    return (
      <div className={[styles.inputRow, 'flex items-end overflow-visible'].join(' ')}>
        <IconButton style={attachmentButtonStyle}>
          <FileInput onFileSelected={imageInputEventHandler(this.props.onCreateAttachment)}>
            <ContentAdd color={colors.main} />
          </FileInput>
        </IconButton>
        <inviteUserIcon />
        <div className='flex-grow relative'>
          <TextField
            id='chatbox'
            hintText='Type your response'
            underlineShow={false}
            textareaStyle={whiteTextInputStyle}
            multiLine
            rowsMax={4}
            fullWidth
            value={message}
            onChange={this.handleMessageInput.bind(this)}
            ref='messageInput'
          />
        </div>
        <div className='mb2 pb1 mr2 ml1'>
          <FloatingActionButton mini zDepth={0} iconStyle={sendIconStyle}
            onClick={this.handleCreateMessage.bind(this)}
            disabled={message === ''}>
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
  userBzLogin: PropTypes.string.isRequired,
  onCreateComment: PropTypes.func.isRequired,
  onCreateAttachment: PropTypes.func.isRequired,
  onRetryAttachment: PropTypes.func.isRequired,
  onThumbClicked: PropTypes.func.isRequired,
  onMoreInfo: PropTypes.func
}

export default CaseMessages
