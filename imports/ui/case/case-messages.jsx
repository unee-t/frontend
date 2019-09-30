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
import Recorder from 'recorder-js'
import { formatDayText } from '../../util/formatters'
import { matchWidth } from '../../util/cloudinary-transformations'
import { attachmentTextMatcher, floorPlanTextMatcher } from '../../util/matchers'
import UserAvatar from '../components/user-avatar'
import FileInput from '../components/file-input'
import UploadPreloader from '../components/upload-preloader'
import { fileInputReaderEventHandler } from '../util/dom-api'
import styles from './case.mss'
import themes from '../components/user-themes.mss'
import colors from '../../mui-theme/colors'
import {
  subheaderStyle,
  infoIconStyle,
  attachmentButtonStyle,
  sendIconStyle,
  addPersonCaseMsg,
  recButtonIconStyle
} from './case.mui-styles'

import {
  whiteTextInputStyle
} from '../components/form-controls.mui-styles'
import ChatBotUI from './chatbot-ui'
import ErrorDialog from '../dialogs/error-dialog'
import FloorPlanEditor from '../components/floor-plan-editor'
import randToken from 'rand-token'

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

const recordTimeLimitSecs = 60

const formatTimeStamp = totalSecs => {
  const minutes = Math.floor(totalSecs / 60)
  const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString()
  const seconds = Math.floor(totalSecs % 60)
  const secondsStr = seconds < 10 ? '0' + seconds : seconds.toString()

  return `${minutesStr}:${secondsStr}`
}

class CaseMessages extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      message: '',
      showVoiceRecorder: false,
      isRecording: false,
      elapsedRecordingSeconds: 0,
      isVoicePreviewPlaying: false,
      recordedBlobUrl: null,
      showVoiceRecordError: false,
      previewAudioDuration: null,
      previewAudioCurrentTime: 0,
      showTimeLimitWarning: false
    }

    this.recordedBlob = null
    this.audioStream = null
    this.recordingUIInterval = null
    this.playbackUIInterval = null
    this.voiceFeedbackEl = null

    this.attachmentRenderers = {
      image: this.renderMessageImageContent.bind(this),
      audio: this.renderMessageAudioContent.bind(this)
    }

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()

    this.recorder = new Recorder(this.audioContext, {
      onAnalysed: data => {
        if (this.voiceFeedbackEl) {
          const val = Math.round(this.voiceFeedbackEl.parentElement.offsetWidth * data.lineTo / 255 * 1.25) + 'px'

          this.voiceFeedbackEl.style.width = val
          this.voiceFeedbackEl.style.height = val
        }
      }
    })
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

  startRecording = () => {
    this.recorder.start()
      .then(() => {
        this.setState({
          isRecording: true,
          elapsedRecordingSeconds: 0
        })
        const startTime = Date.now()
        this.recordingUIInterval = setInterval(() => {
          const { elapsedRecordingSeconds } = this.state
          const currElapsed = Math.floor((Date.now() - startTime) / 1000)
          if (elapsedRecordingSeconds !== currElapsed) {
            if (currElapsed >= recordTimeLimitSecs) {
              this.stopRecording(true)
            } else {
              this.setState({
                elapsedRecordingSeconds: currElapsed
              })
            }
          }
        }, 250)
      })
  }

  stopRecording = (timeLimitReached = false) => {
    this.recorder.stop()
      .then(({ blob }) => {
        this.recordedBlob = blob
        clearInterval(this.recordingUIInterval)
        this.setState({
          elapsedRecordingSeconds: 0,
          previewAudioDuration: null,
          previewAudioCurrentTime: 0,
          isRecording: false,
          recordedBlobUrl: URL.createObjectURL(this.recordedBlob),
          showTimeLimitWarning: timeLimitReached
        })
        this.audioStream.getTracks().forEach(track => track.stop())
      })
  }

  handleMainActionClicked (evt) {
    const { message } = this.state
    if (message !== '') {
      evt.preventDefault()
      this.props.onCreateComment(message)

      // Clearing the input
      this.setState({
        message: ''
      })
    } else {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          this.recorder.init(stream)
          this.audioStream = stream
          this.startRecording()
          this.setState({
            showVoiceRecorder: true
          })
        })
        .catch(err => {
          console.log('Uh oh... unable to get stream...', err)
          console.error(err)
          this.setState({
            showVoiceRecordError: true
          })
        })
    }
  }

  handleVoicePreviewPlayClicked = () => {
    const { isVoicePreviewPlaying } = this.state

    if (!isVoicePreviewPlaying) {
      this.previewAudio.play()
      this.playbackUIInterval = setInterval(() => {
        this.setState({
          previewAudioCurrentTime: this.previewAudio.currentTime
        })
      }, 250)
      this.previewAudio.addEventListener('ended', this.handleVoicePreviewEnded)
      this.setState({
        isVoicePreviewPlaying: true
      })
    } else {
      this.handlePreviewPaused()
      this.setState({
        isVoicePreviewPlaying: false,
        previewAudioCurrentTime: 0
      })
    }
  }

  handlePreviewPaused = () => {
    this.previewAudio.removeEventListener('ended', this.handleVoicePreviewEnded)
    this.previewAudio.pause()
    this.previewAudio.currentTime = 0
    clearInterval(this.playbackUIInterval)
  }

  handleVoicePreviewEnded = () => {
    this.handlePreviewPaused()
    this.setState({
      isVoicePreviewPlaying: false,
      previewAudioCurrentTime: 0
    })
  }

  handleRecordingSent = () => {
    const { recordedBlobUrl } = this.state
    this.props.onCreateAttachment(recordedBlobUrl, this.recordedBlob)
    this.clearRecordingArtifacts()
  }

  handleRecordingCanceled = () => {
    const { isRecording } = this.state

    if (isRecording) {
      this.recorder.stop()
        .then(() => {
          clearInterval(this.recordingUIInterval)
          this.audioStream.getTracks().forEach(track => track.stop())
          this.setState({
            isRecording: false,
            showVoiceRecorder: false
          })
        })
    } else {
      this.clearRecordingArtifacts()
    }
  }

  handlePreviewAudioRef = el => {
    this.previewAudio = el
  }

  handlePreviewMetadataLoaded = evt => {
    this.setState({
      previewAudioDuration: evt.target.duration
    })
  }

  clearRecordingArtifacts = () => {
    this.recordedBlob = null
    this.handlePreviewPaused()
    this.setState({
      showVoiceRecorder: false,
      isVoicePreviewPlaying: false,
      recordedBlobUrl: null,
      previewAudioDuration: null,
      previewAudioCurrentTime: 0
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
    const messageList = comments.concat(uploads.map(process => {
      const type = process.file.type.split('/')[0]
      return {
        'creation_time': (new Date()).toISOString(),
        creator: this.props.userBzLogin,
        text: `[!attachment(${type})]\n` + process.preview,
        process
      }
    }))
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
            handleFileSelection={fileInputReaderEventHandler(this.props.onCreateAttachment)}
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
    const attachmentType = attachmentTextMatcher(text)
    let contentRenderer
    if (attachmentType) {
      contentRenderer = this.attachmentRenderers[attachmentType]
        ? this.attachmentRenderers[attachmentType]
        : this.renderMessageTextContent.bind(this)
    } else {
      const floorPlanAttrs = floorPlanTextMatcher(text)
      if (floorPlanAttrs) {
        contentRenderer = this.makeFloorPlanRenderer(floorPlanAttrs)
      } else {
        contentRenderer = this.renderMessageTextContent.bind(this)
      }
    }
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
          <UserAvatar user={{ login: creator }} imageUrl={creatorUser && creatorUser.profile.avatarUrl} />
        ) : ''}
        { contentRenderer({ isSelf, creator, creatorUser, text, creationTime, id, process }) }
      </div>
    )
  }

  renderMessageTextContent ({ isSelf, creatorUser, creator, text, creationTime }) {
    // If createUser is unset, i.e. it only has a Bugzilla user and not Meteor user,
    // truncate the email address to show only the local part
    const creatorText = creatorUser
      ? (creatorUser.profile.name || creatorUser.emails[0].address.split('@')[0])
      : creator.split('@')[0]
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

  renderMessageAudioContent ({ isSelf, text, creationTime, id, process }) {
    const attachmentUrl = text.split('\n')[1]
    return (
      <div className={
        'w-60 br3 mh2 dib tc overflow-hidden h4 relative inline-flex items-center ' +
        (isSelf ? 'ml-auto bg-rad-green' : 'bg-white')
      }>
        <audio controls src={attachmentUrl} />
        <div className={styles.messageTime + ' fr f7 absolute bottom-0 right-0 lh-dbl pr2'}>
          {moment(creationTime).format('HH:mm')}
        </div>
        {process && (
          <UploadPreloader handleRetryUpload={this.props.onRetryAttachment} process={process} />
        )}
      </div>
    )
  }
  makeFloorPlanRenderer = ({ id, pins }) => {
    const { unitMetaData } = this.props
    const floorPlan = unitMetaData.floorPlanUrls.find(obj => obj.id === id)
    const translatedPins = pins.map(pin => ({ x: pin[0], y: pin[1], id: randToken.generate(12) }))
    return ({ isSelf, text, creationTime }) => {
      return (
        <div className={
          'w-80 br3 mh2 dib tc ph2 pt2 pb4 bg-white inline-flex items-center relative' + (isSelf ? ' ml-auto' : '')
        }>
          <FloorPlanEditor pins={translatedPins} floorPlan={floorPlan} />
          <div className='fr f7 light-silver absolute bottom-0 right-0 lh-dbl pr2'>
            {moment(creationTime).format('HH:mm')}
          </div>
        </div>
      )
    }
  }

  renderInputControls () {
    const {
      message, showVoiceRecorder, isRecording, isVoicePreviewPlaying, recordedBlobUrl, showVoiceRecordError,
      elapsedRecordingSeconds, previewAudioDuration, previewAudioCurrentTime, showTimeLimitWarning
    } = this.state

    return (
      <div>
        {showVoiceRecorder ? (
          <div className={[styles.inputRow, 'flex items-center overflow-visible ph3 pv2'].join(' ')}>
            {isRecording ? (
              <div className='relative'>
                <div className='absolute left-0 right-0 top-0 bottom-0 z-0 flex items-center justify-center'>
                  <div className='bg-black-20 br-100' ref={el => { this.voiceFeedbackEl = el }} />
                </div>
                <FontIcon
                  className={'material-icons ' + (elapsedRecordingSeconds % 2 === 0 ? 'o-100' : 'o-0')}
                  color='#f00'
                >
                  keyboard_voice
                </FontIcon>
              </div>
            ) : (
              <div className='mr2'>
                <FloatingActionButton
                  mini
                  zDepth={0}
                  iconStyle={{ ...recButtonIconStyle, color: 'var(--bondi-blue)' }}
                  backgroundColor='var(--gray-93)'
                  onClick={this.handleVoicePreviewPlayClicked}
                >
                  <FontIcon className='material-icons'>{isVoicePreviewPlaying ? 'pause' : 'play_arrow'}</FontIcon>
                </FloatingActionButton>
                <audio src={recordedBlobUrl} onLoadedMetadata={this.handlePreviewMetadataLoaded} ref={this.handlePreviewAudioRef} />
              </div>
            )}
            <div className='ml2 mid-gray flex-grow'>
              {isRecording
                ? (
                  formatTimeStamp(elapsedRecordingSeconds)
                )
                : (
                  previewAudioDuration
                    ? `${formatTimeStamp(previewAudioCurrentTime)} / ${formatTimeStamp(previewAudioDuration)}`
                    : '--:-- / --:--'
                )
              }
            </div>
            <div>
              <FlatButton onClick={this.handleRecordingCanceled}>
                <div className='mid-gray ph3'>
                  Cancel
                </div>
              </FlatButton>
            </div>
            <div className='ml3 mb1'>
              {isRecording ? (
                <FloatingActionButton
                  mini
                  zDepth={0}
                  iconStyle={{ ...recButtonIconStyle, color: 'var(--warn-plain-red)' }}
                  backgroundColor='var(--gray-93)'
                  onClick={() => this.stopRecording()}
                >
                  <FontIcon className='material-icons'>stop</FontIcon>
                </FloatingActionButton>
              ) : (
                <FloatingActionButton mini zDepth={0} iconStyle={sendIconStyle} onClick={this.handleRecordingSent}>
                  <FontIcon className='material-icons'>send</FontIcon>
                </FloatingActionButton>
              )}
            </div>
            <ErrorDialog
              show={showTimeLimitWarning}
              text='Voice recording is limited to 1 minute maximum, you can send the last minute of the recording'
              onDismissed={() => this.setState({ showTimeLimitWarning: false })}
            />
          </div>
        ) : (
          <div className={[styles.inputRow, 'flex items-end overflow-visible'].join(' ')}>
            <IconButton style={attachmentButtonStyle}>
              <FileInput
                acceptTypes={{ image: true, audio: true }}
                onFileSelected={fileInputReaderEventHandler(this.props.onCreateAttachment)}
              >
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
                onChange={evt => this.setState({
                  message: evt.target.value
                })}
              />
            </div>
            <div className='mb2 pb1 mr2 ml1'>
              <FloatingActionButton mini zDepth={0} iconStyle={sendIconStyle} onClick={this.handleMainActionClicked.bind(this)}>
                <FontIcon className='material-icons'>{message === '' ? 'keyboard_voice' : 'send'}</FontIcon>
              </FloatingActionButton>
            </div>
          </div>
        )}
        <ErrorDialog
          show={showVoiceRecordError}
          text='Voice recording has been denied or disabled on this device'
          onDismissed={() => this.setState({ showVoiceRecordError: false })}
        />
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
  onMoreInfo: PropTypes.func,
  unitMetaData: PropTypes.object
}

export default CaseMessages
