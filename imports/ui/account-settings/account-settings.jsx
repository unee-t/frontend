// @flow
/* global HTMLInputElement */
import * as React from 'react'
import { Meteor } from 'meteor/meteor'
import InnerAppBar from '../components/inner-app-bar'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import { goBack, push } from 'react-router-redux'
import CircularProgress from 'material-ui/CircularProgress'
import MenuItem from 'material-ui/MenuItem'
import FontIcon from 'material-ui/FontIcon'
import FlatButton from 'material-ui/FlatButton'

import { infoItemMembers } from '../util/static-info-rendering'
import FileInput from '../components/file-input'
import { fileInputReaderEventHandler } from '../util/dom-api'
import InputRow from '../components/input-row'
import { editProfileField, uploadAvatarImage } from '/imports/state/actions/account-edit.actions'
import { fitDimensions } from '../../util/cloudinary-transformations'

type Props = {
  user: {
    profile: {
      name?: string,
      firstName?: string,
      lastName?: string,
      phoneNumber?: string,
      avatarUrl?: string
    },
    emails: Array<{
      address: string
    }>
  },
  dispatch: (action: { type: string }) => void,
  isUploadingAvatar: boolean,
  uploadingAvatarPercent: number,
  uploadingAvatarError?: Object
}
type State = {
  avatarPreview: ?string,
  editMode: boolean
}
class AccountSettings extends React.Component<Props, State> {
  state = {
    avatarPreview: null,
    editMode: false
  }

  firstField: ?HTMLInputElement

  componentDidUpdate (prevProps, prevState) {
    if (prevProps.isUploadingAvatar && !this.props.isUploadingAvatar) {
      this.setState({
        avatarPreview: null
      })
    }
    if (!prevState.editMode && this.state.editMode) {
      setTimeout(() => { // Had to set timeout as the field is not focusable immediately after becoming enabled
        if (this.firstField) this.firstField.focus()
      }, 100)
    }
  }

  render () {
    const { user, dispatch, isUploadingAvatar, uploadingAvatarPercent } = this.props
    const { avatarPreview, editMode } = this.state
    return (
      <div className='full-height flex flex-column'>
        <InnerAppBar
          title='Account'
          onBack={() => dispatch(goBack())}
          rightIconElement={
            <FlatButton
              label={editMode ? 'Save' : 'Edit'}
              onClick={() => this.setState({ editMode: !editMode })}
            />
          }
        />
        {!user ? (
          <div className='flex-grow flex items-center justify-center'>
            <CircularProgress size={50} thickness={4} />
          </div>
        ) : (
          <div className='flex-grow flex flex-column pt3 overflow-auto'>
            <div className='flex flex-column no-shrink'>
              <div className='flex flex-column items-center'>
                {(avatarPreview || user.profile.avatarUrl) ? (
                  <div className='w4 h4 br-100 relative overflow-hidden'>
                    <img
                      className={'obj-cover w-100' + (isUploadingAvatar ? ' o-60' : '')}
                      src={avatarPreview || fitDimensions(user.profile.avatarUrl, 126, 126)}
                      alt='Avatar Pic'
                    />
                    {isUploadingAvatar && (
                      <div className='absolute top-0 bottom-0 right-0 left-0 flex items-center justify-center'>
                        {uploadingAvatarPercent ? (
                          <CircularProgress
                            size={40} thickness={4} mode='determinate' value={uploadingAvatarPercent} />
                        ) : (
                          <div className='dib'>
                            <CircularProgress
                              size={40} thickness={4} mode='indeterminate' />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='w4 h4 br-100 bg-light-gray light-silver tc f2 lh-copy flex justify-center items-center'>
                    {(user.profile.name || user.emails[0].address.split('@')[0]).charAt(0).toUpperCase()}
                  </div>
                )}
                <FileInput onFileSelected={fileInputReaderEventHandler((preview, file) => {
                  this.setState({
                    avatarPreview: preview
                  })
                  dispatch(uploadAvatarImage(file))
                })}>
                  <MenuItem>
                    <div className='fw5 ph2 bondi-blue'>
                      Change Profile Picture
                    </div>
                  </MenuItem>
                </FileInput>
              </div>
              <div className='ph3 pb2 flex flex-column bb b--light-gray bw3'>
                <div className='flex'>
                  <div className='flex-grow'>
                    <InputRow
                      disabled={!editMode}
                      underlineShow={editMode}
                      label='First Name'
                      value={user.profile.firstName || ((user.profile.name && !user.profile.lastName) ? user.profile.name : '')}
                      onChange={evt => dispatch(editProfileField('firstName', evt.target.value))}
                      inpRef={el => { this.firstField = el }}
                    />
                  </div>
                  <div className='ml3 flex-grow'>
                    <InputRow
                      disabled={!editMode}
                      underlineShow={editMode}
                      label='Last Name'
                      value={user.profile.lastName}
                      onChange={evt => dispatch(editProfileField('lastName', evt.target.value))}
                    />
                  </div>
                </div>
                {/* <EmailInput label='Email' email={user.emails[0].address} onEmailChanged={() => {}} /> */}
                <div className='mt2'>
                  {infoItemMembers('Email', user.emails[0].address)}
                </div>
                <InputRow
                  disabled={!editMode}
                  underlineShow={editMode}
                  label='Phone'
                  value={user.profile.phoneNumber}
                  onChange={evt => dispatch(editProfileField('phoneNumber', evt.target.value))}
                />
                {/* <div className='mt2 pt1'>
                {infoItemLabel('Password')}
                <div className='flex items-center'>
                  <div className='mid-gray flex-grow'>
                    ********
                  </div>
                  <IconButton>
                    <FontIcon className='material-icons' color='var(--silver)'>edit</FontIcon>
                  </IconButton>
                </div>
              </div> */}
              </div>
              <div className='bb b--light-gray bw3'>
                <MenuItem onClick={() => dispatch(push('/notification-settings'))}>
                  <div className='flex items-center pv1'>
                    <div className='flex-grow bondi-blue'>
                      Notification Settings
                    </div>
                    <FontIcon className='material-icons' color='var(--mid-gray)'>keyboard_arrow_right</FontIcon>
                  </div>
                </MenuItem>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
}

export default connect(
  ({ avatarChangingState }) => ({
    isUploadingAvatar: avatarChangingState.inProgress,
    uploadingAvatarPercent: avatarChangingState.percent || 0,
    uploadingAvatarError: avatarChangingState.error
  })
)(createContainer(() => {
  return {
    user: Meteor.user()
  }
}, AccountSettings))
