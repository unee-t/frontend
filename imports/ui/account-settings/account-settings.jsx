// @flow
import * as React from 'react'
import { Meteor } from 'meteor/meteor'
import InnerAppBar from '../components/inner-app-bar'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import { goBack, push } from 'react-router-redux'
import CircularProgress from 'material-ui/CircularProgress'
import MenuItem from 'material-ui/MenuItem'
import IconButton from 'material-ui/IconButton'
import FontIcon from 'material-ui/FontIcon'

import { infoItemLabel } from '../util/static-info-rendering'
import FileInput from '../components/file-input'
import { imageInputEventHandler } from '../util/dom-api'
import InputRow from '../components/input-row'
import EmailInput from '../components/email-input'
import { editProfileField } from '/imports/state/actions/account-edit.actions'

type Props = {
  user: {
    profile: {
      name?: string,
      firstName?: string,
      lastName?: string,
      phoneNumber?: string
    },
    emails: Array<{
      address: string
    }>
  },
  dispatch: (action: { type: string }) => void
}
type State = {
  avatarPreview: ?string
}
class AccountSettings extends React.Component<Props, State> {
  state = {
    avatarPreview: null
  }
  render () {
    const { user, dispatch } = this.props
    const { avatarPreview } = this.state
    return (
      <div className='full-height flex flex-column'>
        <InnerAppBar title='Account' onBack={() => dispatch(goBack())} />
        {!user ? (
          <div className='flex-grow flex items-center justify-center'>
            <CircularProgress size={50} thickness={4} />
          </div>
        ) : (
          <div className='flex-grow flex flex-column pt3'>
            <div className='flex flex-column items-center'>
              {avatarPreview ? (
                <img className='w4 h4 br-100 obj-cover' src={avatarPreview} alt='Avatar Pic' />
              ) : (
                <div className='w4 h4 br-100 bg-light-gray light-silver tc f2 lh-copy flex justify-center items-center'>
                  {(user.profile.name || user.emails[0].address.split('@')[0]).charAt(0).toUpperCase()}
                </div>
              )}
              <FileInput onFileSelected={imageInputEventHandler((preview, file) => {
                this.setState({
                  avatarPreview: preview
                })
              })}>
                <MenuItem>
                  <div className='fw5 ph2 bondi-blue'>
                    Change Profile Picture
                  </div>
                </MenuItem>
              </FileInput>
            </div>
            <div className='ph3 pb1 flex flex-column bb b--light-gray'>
              <div className='flex'>
                <div className='flex-grow'>
                  <InputRow
                    label='First Name'
                    value={user.profile.firstName || ((user.profile.name && !user.profile.lastName) ? user.profile.name : '')}
                    onChange={evt => dispatch(editProfileField('firstName', evt.target.value))}
                  />
                </div>
                <div className='ml3 flex-grow'>
                  <InputRow
                    label='Last Name'
                    value={user.profile.lastName}
                    onChange={evt => dispatch(editProfileField('lastName', evt.target.value))}
                  />
                </div>
              </div>
              <EmailInput label='Email' email={user.emails[0].address} onEmailChanged={() => {}} />
              <InputRow
                label='Phone'
                value={user.profile.phoneNumber}
                onChange={evt => dispatch(editProfileField('phoneNumber', evt.target.value))}
              />
              <div className='mt2 pt1'>
                {infoItemLabel('Password')}
                <div className='flex items-center'>
                  <div className='mid-gray flex-grow'>
                    ********
                  </div>
                  <IconButton>
                    <FontIcon className='material-icons' color='var(--silver)'>edit</FontIcon>
                  </IconButton>
                </div>
              </div>
            </div>
            <MenuItem onClick={() => dispatch(push('/notification-settings'))}>
              <div className='flex items-center pv1'>
                <div className='flex-grow bondi-blue'>
                  Notification Settings
                </div>
                <FontIcon className='material-icons' color='var(--mid-gray)'>keyboard_arrow_right</FontIcon>
              </div>
            </MenuItem>
          </div>
        )}
      </div>
    )
  }
}

export default connect(() => ({}))(createContainer(() => {
  return {
    user: Meteor.user()
  }
}, AccountSettings))
