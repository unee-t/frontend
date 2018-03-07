import React, { Component } from 'react'
import PropTypes from 'prop-types'
import TextField from 'material-ui/TextField'
import {
  textInputFloatingLabelStyle,
  textInputStyle,
  textInputUnderlineFocusStyle
} from '../components/form-controls.mui-styles'

export default class InputRow extends Component {
  render () {
    const { inpType, inpRef, label, placeholder, errorText, disabled, value, onChange } = this.props
    const type = inpType || 'text'
    return (
      <TextField
        floatingLabelText={label}
        floatingLabelShrinkStyle={textInputFloatingLabelStyle}
        underlineFocusStyle={textInputUnderlineFocusStyle}
        inputStyle={textInputStyle}
        fullWidth
        hintText={placeholder}
        ref={inpRef}
        {...{type, errorText, disabled, value, onChange}}
      />
    )
  }
}

InputRow.propTypes = {
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.any,
  errorText: PropTypes.string,
  inpRef: PropTypes.func,
  inpType: PropTypes.string,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string
}
