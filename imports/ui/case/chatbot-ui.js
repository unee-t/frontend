import React, { Component } from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import styles from './case.mss'
import { Link } from 'react-router-dom'
import { UneeTIcon } from '../components/unee-t-icons'
import IconButton from 'material-ui/IconButton'
import {
  logoIconStyle,
  logoButtonStyle
} from '../components/app-bar.mui-styles'

export default class ChatBotUI extends Component {
  assigneeBot () {
    const creationTime = (new Date()).toISOString()
    const assignedUserRole = this.props.caseItem.assignedUnitRole
    return (
      <div>
          You've created a new case! The case has been assigned to <span className='fw5'> {assignedUserRole} </span>and we've notified them.
        <div className={styles.messageTime + ' fr f7'}>
          {moment(creationTime).format('HH:mm')}
        </div>
      </div>
    )
  }

  inviteBot () {
    const caseId = this.props.caseItem._id
    return (
      <Link to={`/case/${caseId}/details/invite`} className='link'>
        <div className='tc bondi-blue pv2'>
        Invite People
        </div>
      </Link>
    )
  }

  photoBot () {
    return (
      <div className='tc bondi-blue pv2'>
        <label>
          Add Photo
          <input type='file' className='dn' onChange={this.props.handleFileSelection.bind(this)} />
        </label>
      </div>
    )
  }

  render () {
    const chatbotMsg = [
      {id: 1, msg: this.assigneeBot(), link: null},
      {id: 2, msg: 'Would you like to inform someone else about this case?', link: this.inviteBot()},
      {id: 3,
        msg: <span><span className='fw5'>Tip: </span> You can also add photos to your case so your correspondents have a better understanding of the case</span>,
        link: this.photoBot()}
    ]
    return (
      <div>
        { chatbotMsg.map((msg) =>
          <div className='inline-flex items-end mb3' key={msg.id} >
            <IconButton iconStyle={logoIconStyle} style={logoButtonStyle} >
              <UneeTIcon className='ml2 ' isDarkType style={{width: '3rem', height: '3rem'}} />
            </IconButton>
            <div className='flex flex-column mr2' >
              <div className={'mw-60 cf br3 pt2 pl3 pr2 mh2 dib tl bg-white ' + (msg.link ? 'br--top bb b--gray-93' : '')}>
                <span className='bondi-blue f6 pb1'> Unee-T </span>
                <div className='pv1 f5 mr3'>
                  {msg.msg}
                </div>
              </div>
              <div className='mw-60 cf br3 br--bottom pl3 pr2 mh2 dib tl bg-white'>
                {msg.link}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
}

ChatBotUI.propTypes = {
  caseItem: PropTypes.object.isRequired,
  handleFileSelection: PropTypes.func.isRequired,
  onCreateAttachment: PropTypes.func.isRequired
}
