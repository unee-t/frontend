import React from 'react'
import PropTypes from 'prop-types'

import AppBar from 'material-ui/AppBar'
import IconButton from 'material-ui/IconButton'
import FontIcon from 'material-ui/FontIcon'
import { UneeTIcon } from '../components/unee-t-icons'

import {
  titleStyle,
  logoIconStyle,
  logoButtonStyle
} from '../components/app-bar.mui-styles'

const RootAppBar = ({ title, onIconClick, shadowless }) => (
  <AppBar title={title} titleStyle={titleStyle} style={shadowless ? {boxShadow: 'none'} : undefined}
    iconElementLeft={
      <IconButton iconStyle={logoIconStyle} style={logoButtonStyle} onClick={onIconClick}>
        <UneeTIcon />
      </IconButton>
    }
    iconElementRight={
      <div>
        <IconButton>
          <FontIcon className='material-icons' color='white'>search</FontIcon>
        </IconButton>
        <IconButton>
          <FontIcon className='material-icons' color='white'>notifications</FontIcon>
        </IconButton>
      </div>
    }
  />
)
RootAppBar.propTypes = {
  title: PropTypes.string.isRequired,
  onIconClick: PropTypes.func
}

export default RootAppBar
