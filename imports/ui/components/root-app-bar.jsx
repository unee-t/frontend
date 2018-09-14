import React, { Component } from 'react'
import PropTypes from 'prop-types'
import AppBar from 'material-ui/AppBar'
import IconButton from 'material-ui/IconButton'
import FontIcon from 'material-ui/FontIcon'
import { UneeTIcon } from '../components/unee-t-icons'
import SearchBar from './search-bar'
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
    const { title, onIconClick, shadowless, findUnit, searchOff } = this.props
    const { searchTextDisplay } = this.state

    return (
      <AppBar
        title={searchTextDisplay ? <SearchBar findUnit={findUnit} /> : title}
        id={title}
        titleStyle={titleStyle}
        style={shadowless ? {boxShadow: 'none'} : undefined}
        iconElementLeft={
          searchTextDisplay ? (
            <IconButton>
              <FontIcon className='material-icons' color='white'
                onClick={() => { this.setState({searchTextDisplay: false}); searchOff() }}
              //  onClick={searchOff;() => this.setState({searchTextDisplay: false})}
              >
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
            <IconButton>
              <FontIcon className='material-icons' color='white'
                onClick={() => title === 'My Units' && this.setState({searchTextDisplay: true})}>
                search
              </FontIcon>
            </IconButton>
            <IconButton>
              <FontIcon className='material-icons' color='white'>notifications</FontIcon>
            </IconButton>
          </div>
        }
      />)
  }
}

RootAppBar.propTypes = {
  title: PropTypes.string.isRequired,
  onIconClick: PropTypes.func
}

export default RootAppBar
