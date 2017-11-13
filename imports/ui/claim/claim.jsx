import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import moment from 'moment'
import { Meteor } from 'meteor/meteor'
import Claims from '../../api/claims'
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

import styles from './claim.mss'
import {
  logoIconStyle,
  logoButtonStyle,
  subheaderStyle,
  titleStyle,
  moreVertIconColor,
  attachmentIconStyle,
  attachmentButtonStyle,
  sendIconStyle
} from './claim.mui-styles'

const UneeTIcon = (props) => (
  <SvgIcon {...props} viewBox='3 3 39 39'>
    <use xlinkHref='/unee-t_logo_reverse.svg#icon' />
  </SvgIcon>
)

class Claim extends Component {
  render () {
    const { claim, comments, loadingClaim, claimError } = this.props
    if (claimError) return <h1>{claimError.error.message}</h1>
    if (loadingClaim) return <Preloader />

    return (
      <div className='flex flex-column full-height roboto'>
        {this.renderTitle(claim)}
        {this.renderMessages(comments)}
        {this.renderInputControls(claim)}
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
    return (
      <div className={[styles.messagesContainer, 'flex-grow', 'overflow-auto'].join(' ')}>
        {comments.map(({id, creator, text, creation_time}) => (
          <div className='mv2' key={id}>
            <div className={[styles.messageAvatar, 'dib bg-gray v-btm br-100 tc white'].join(' ')}>
              {creator.slice(0, 1).toUpperCase()}
            </div>
            <div className={[styles.messageBox, 'cf bg-white br3 pt2 pl3 pr2 ml2 dib'].join(' ')}>
              <div className={[styles.messageCreator, 'f6'].join(' ')}>{creator}</div>
              <span className='f5 mr3'>{text}</span>
              <div className={[styles.messageTime, 'fr', 'f7'].join(' ')}>
                {moment(creation_time).format('hh:mma')}
              </div>
            </div>
          </div>
        ))}
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
          className='input-reset bg-white br-pill ba b--moon-gray lh-input h2 ph3 dib flex-grow outline-0' />
        <div className='mh2'>
          <FloatingActionButton mini zDepth={0} iconStyle={sendIconStyle}>
            <FontIcon className='material-icons'>send</FontIcon>
          </FloatingActionButton>
        </div>
      </div>
    )
  }
}

Claim.propTypes = {
  loadingClaim: PropTypes.bool,
  claimError: PropTypes.object,
  claim: PropTypes.object,
  loadingComments: PropTypes.bool,
  commentsError: PropTypes.object,
  comments: PropTypes.array
}

let claimError, commentsError
const ClaimContainer = createContainer(props => {
  const { claimId } = props.match.params
  const claimHandle = Meteor.subscribe('claim', claimId, {
    onStop: (error) => {
      claimError = error
    }
  })
  const commentsHandle = Meteor.subscribe('claimComments', claimId, {
    onStop: (error) => {
      commentsError = error
    }
  })

  return {
    loadingClaim: !claimHandle.ready(),
    claimError,
    claim: Claims.findOne(claimId),
    loadingComments: !commentsHandle.ready(),
    commentsError,
    comments: Comments.find({bug_id: parseInt(claimId)}).fetch()
  }
}, Claim)

function mapStateToProps (state) {
  return {
  }
}

export default connect(mapStateToProps)(ClaimContainer)
