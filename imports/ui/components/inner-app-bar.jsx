import React from 'react'
import PropTypes from 'prop-types'
import AppBar from 'material-ui/AppBar'
import IconButton from 'material-ui/IconButton'
import FontIcon from 'material-ui/FontIcon'

import { titleStyle } from './app-bar.mui-styles'
const InnerAppBar = ({title, onBack}) => (
  <AppBar
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
  onBack: PropTypes.func.isRequired
}

export default InnerAppBar
