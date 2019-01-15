// @flow
/* global Event */
import * as React from 'react'
// import PropTypes from 'prop-types'
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

type Props = {
  showSearch?: boolean,
  title: string,
  onIconClick?: (evt: Event) => void,
  onSearchChanged?: (searchText: string) => void,
  onNavigationRequested?: () => void,
  searchText?: string,
  onSearchRequested?: () => void,
  onBackClicked?: () => void,
  searchActive?: boolean,
  rightSideElement?: React.Node,
  shadowless?: boolean
}
export default class RootAppBar extends React.Component<Props> {
  render () {
    const {
      title, onIconClick, shadowless, searchText, showSearch, rightSideElement,
      onSearchRequested, onBackClicked, onSearchChanged, searchActive, onNavigationRequested
    } = this.props
    return (
      <AppBar
        title={searchActive
          ? (
            <TextField
              name='searchText'
              floatingLabelShrinkStyle={textInputFloatingLabelStyle}
              underlineFocusStyle={textInputUnderlineFocusStyle}
              inputStyle={whiteInput}
              hintStyle={whiteInput}
              fullWidth
              value={searchText}
              onChange={evt => onSearchChanged && onSearchChanged(evt.target.value)}
              onKeyPress={evt => {
                if (evt.charCode === 13) {
                  onNavigationRequested && onNavigationRequested()
                }
              }}
            />
          )
          : (title)
        }
        id={title}
        titleStyle={titleStyle}
        style={shadowless ? { boxShadow: 'none' } : undefined}
        iconElementLeft={
          searchActive ? (
            <IconButton
              onClick={onBackClicked}
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
          <div className='flex items-center'>
            <span className={((!showSearch || searchActive) ? 'dn' : '')}>
              <IconButton onClick={onSearchRequested}>
                <FontIcon className='material-icons' color='white'>
                  search
                </FontIcon>
              </IconButton>
            </span>
            <IconButton>
              <FontIcon className='material-icons' color='white'>notifications</FontIcon>
            </IconButton>
            {rightSideElement}
          </div>
        }
      />)
  }
}
