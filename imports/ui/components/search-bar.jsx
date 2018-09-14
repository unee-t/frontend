import React, { Component } from 'react'
import TextField from 'material-ui/TextField'
import {
  textInputStyle,
  textInputFloatingLabelStyle,
  textInputUnderlineFocusStyle
} from '../components/form-controls.mui-styles'

export default class SearchBar extends Component {
  constructor (props) {
    super(props)
    this.state = {
      searchText: ''
    }
  }

  handleSearch = (evt) => {
    this.setState({searchText: evt.target.value})
    this.props.findUnit(evt.target.value)
  }

  render () {
    const { searchText } = this.state
    return (
      <TextField
        hintText='Search'
        floatingLabelShrinkStyle={textInputFloatingLabelStyle}
        underlineFocusStyle={textInputUnderlineFocusStyle}
        inputStyle={textInputStyle}
        fullWidth
        value={searchText}
        onChange={(evt) => this.handleSearch(evt)}
      />
    )
  }
}
