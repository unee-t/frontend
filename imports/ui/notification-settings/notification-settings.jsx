import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import InnerAppBar from '../components/inner-app-bar'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import PropTypes from 'prop-types'
import { goBack } from 'react-router-redux'
import Toggle from 'material-ui/Toggle'
import CircularProgress from 'material-ui/CircularProgress'

import { infoItemLabel } from '../util/static-info-rendering'
import { settingChanged } from './notification-settings.actions'

import { toggleLabelStyle } from './notification-settings.mui-styles'

class NotificationSettings extends Component {
  handleSettingToggled = (settingName, isOn) => {
    this.props.dispatch(settingChanged(settingName, isOn))
  }
  render () {
    const { settings, dispatch } = this.props
    return (
      <div className='full-height flex flex-column'>
        <InnerAppBar title='Notification Settings' onBack={() => dispatch(goBack())} />
        <div className='flex-grow flex flex-column pa3'>
          {infoItemLabel('Receive email updates')}
          <div className='mt2 pa1 relative'>
            <div className={!settings ? 'o-40' : ''}>
              <Toggle
                className='mt2' labelStyle={toggleLabelStyle}
                label='When assigned to a new case'
                toggled={!!settings && settings.assignedNewCase}
                onToggle={(evt, isChecked) => this.handleSettingToggled('assignedNewCase', isChecked)}
              />
              <Toggle
                className='mt2' labelStyle={toggleLabelStyle}
                label='When assigned to an existing case'
                toggled={!!settings && settings.assignedExistingCase}
                onToggle={(evt, isChecked) => this.handleSettingToggled('assignedExistingCase', isChecked)}
              />
              <Toggle
                className='mt2'
                labelStyle={toggleLabelStyle}
                label='When invited to a case'
                toggled={!!settings && settings.invitedToCase}
                onToggle={(evt, isChecked) => this.handleSettingToggled('invitedToCase', isChecked)}
              />

              <Toggle
                className='mt2'
                labelStyle={toggleLabelStyle}
                label='When there is a new message on a case'
                toggled={!!settings && settings.caseNewMessage}
                onToggle={(evt, isChecked) => this.handleSettingToggled('caseNewMessage', isChecked)}
              />

              <Toggle
                className='mt2'
                labelStyle={toggleLabelStyle}
                label='When a case is updated'
                toggled={!!settings && settings.caseUpdate}
                onToggle={(evt, isChecked) => this.handleSettingToggled('caseUpdate', isChecked)}
              />

            </div>
            {!settings && (
              <div className='absolute tc pa3 top-0 right-0 left-0'>
                <CircularProgress size={30} />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
}

NotificationSettings.propTypes = {
  settings: PropTypes.object
}

export default connect(() => ({}))(createContainer(() => {
  const handle = Meteor.subscribe('users.myNotificationSettings')

  return {
    settings: handle.ready() ? Meteor.user().notificationSettings : null
  }
}, NotificationSettings))
