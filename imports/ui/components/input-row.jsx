import React, { Component } from 'react'
import PropTypes from 'prop-types'

import StickyTextField from './sticky-text-field'

import {
  textInputFloatingLabelStyle,
  textInputStyle,
  textInputUnderlineFocusStyle
} from '../components/form-controls.mui-styles'

export default class InputRow extends Component {
  render () {
    const { inpType, inpRef, label, isFloatingLabelFixed, placeholder, errorText, disabled, value, onChange, isMultiLine } = this.props
    const type = inpType || 'text'
    return (
      <StickyTextField
        floatingLabelText={label}
        floatingLabelFixed={!!isFloatingLabelFixed}
        floatingLabelShrinkStyle={textInputFloatingLabelStyle}
        underlineFocusStyle={textInputUnderlineFocusStyle}
        inputStyle={textInputStyle}
        fullWidth
        multiLine={!!isMultiLine}
        hintText={placeholder}
        inpRef={inpRef}
        {...{ type, errorText, disabled, value, onChange }}
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
  isMultiLine: PropTypes.bool,
  placeholder: PropTypes.string
}
