// @flow
/* global SyntheticInputEvent, HTMLInputElement */
import * as React from 'react'

import StickyTextField from './sticky-text-field'

import {
  textInputFloatingLabelStyle,
  textInputStyle,
  textInputUnderlineFocusStyle
} from '../components/form-controls.mui-styles'

type Props = {
  label: string,
  onChange: (evt: SyntheticInputEvent<HTMLInputElement>) => void,
  value: ?string,
  errorText?: ?string,
  inpRef?: (el: HTMLInputElement) => void,
  disabled?: boolean,
  isMultiLine?: boolean,
  placeholder?: string,
  underlineShow?: boolean,
  inpType?: string,
  isFloatingLabelFixed?: boolean
}

export default class InputRow extends React.Component<Props> {
  render () {
    const {
      inpType, inpRef, label, isFloatingLabelFixed, placeholder,
      errorText, disabled, value, onChange, isMultiLine, underlineShow
    } = this.props
    const doShowUnderline = typeof underlineShow === 'boolean' ? underlineShow : true
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
        underlineShow={doShowUnderline}
        {...{ type, errorText, disabled, value, onChange }}
      />
    )
  }
}
