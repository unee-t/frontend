import React from 'react'
import PropTypes from 'prop-types'
import AppBar from 'material-ui/AppBar'
import IconButton from 'material-ui/IconButton'
import FontIcon from 'material-ui/FontIcon'

import { titleStyle } from './app-bar.mui-styles'
const InnerAppBar = ({title, onBack, shadowless}) => (
  <AppBar
    style={shadowless ? {boxShadow: 'none'} : undefined}
    title={title}
    titleStyle={titleStyle}
    iconElementLeft={
      <IconButton onClick={onBack}>
        <FontIcon className='material-icons' color='white'>arrow_back</FontIcon>
      </IconButton>
    }
  />
)

InnerAppBar.propTypes = {
  title: PropTypes.string,
  onBack: PropTypes.func.isRequired,
  shadowless: PropTypes.bool
}

export default InnerAppBar
