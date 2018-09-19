import React, { Component } from 'react'
import PropTypes from 'prop-types'
import AppBar from 'material-ui/AppBar'
import IconButton from 'material-ui/IconButton'
import FontIcon from 'material-ui/FontIcon'
import { UneeTIcon } from '../components/unee-t-icons'
import TextField from 'material-ui/TextField'
import {
  textInputFloatingLabelStyle,
  textInputUnderlineFocusStyle,
  whiteInput
} from '../components/form-controls.mui-styles'
import {
  titleStyle,
  logoIconStyle,
  logoButtonStyle
} from '../components/app-bar.mui-styles'

class RootAppBar extends Component {
  constructor (props) {
    super(props)
    this.state = {
      searchTextDisplay: false
    }
  }

  render () {
    const { title, onSearchChanged, placeholder, onIconClick, shadowless, searchText } = this.props
    const { searchTextDisplay } = this.state
    return (
      <AppBar
        title={searchTextDisplay
          ? (
            <TextField
              hintText={placeholder}
              floatingLabelShrinkStyle={textInputFloatingLabelStyle}
              underlineFocusStyle={textInputUnderlineFocusStyle}
              inputStyle={whiteInput}
              hintStyle={whiteInput}
              fullWidth
              value={searchText}
              onChange={(evt) => onSearchChanged(evt.target.value)}
            />
          )
          : (title)
        }
        id={title}
        titleStyle={titleStyle}
        style={shadowless ? {boxShadow: 'none'} : undefined}
        iconElementLeft={
          searchTextDisplay ? (
            <IconButton
              onClick={() => this.setState({searchTextDisplay: false})}
            >
              <FontIcon className='material-icons' color='white'>
               arrow_back</FontIcon>
            </IconButton>
          ) : (
            <IconButton iconStyle={logoIconStyle} style={logoButtonStyle} onClick={onIconClick}>
              <UneeTIcon />
            </IconButton>
          )
        }
        iconElementRight={
          <div>
            <span className={(searchTextDisplay ? 'dn' : '')}>
              <IconButton onClick={() => this.setState({searchTextDisplay: true})}>
                <FontIcon className='material-icons' color='white'>
                  search
                </FontIcon>
              </IconButton>
            </span>
            <IconButton>
              <FontIcon className='material-icons' color='white'>notifications</FontIcon>
            </IconButton>
          </div>
        }
      />)
  }
}

RootAppBar.propTypes = {
  showSearch: PropTypes.bool,
  title: PropTypes.string.isRequired,
  onIconClick: PropTypes.func,
  onSearchChanged: PropTypes.func,
  searchText: PropTypes.string
}

export default RootAppBar
