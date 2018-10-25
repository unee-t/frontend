import React, { Component } from 'react'
import PropTypes from 'prop-types'
import TextField from 'material-ui/TextField'

import { emailValidator } from '/imports/util/validators'

import {
  textInputFloatingLabelStyle,
  textInputStyle,
  textInputUnderlineFocusStyle
} from './form-controls.mui-styles'

class EmailInput extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      emailError: null
    }
  }
  handleEmailChanged = evt => {
    const { value } = evt.target
    const { onEmailChanged, onValidityChanged, invalidReasonMessage, invalidEmails } = this.props
    let emailError
    if (!value || !emailValidator(value)) {
      emailError = !value ? 'Email is required' : 'This address is invalid'

      // Checking whether the email belongs to an existing role bearer for this unit
    } else if (invalidEmails && invalidEmails.includes(value)) {
      emailError = invalidReasonMessage
    }
    this.setState({
      emailError
    })
    onEmailChanged(value)
    onValidityChanged && onValidityChanged(!emailError)
  }

  render () {
    const { emailError } = this.state
    const { disabled, label, inputRef, email } = this.props
    return (
      <TextField
        hintText='Type the email address'
        floatingLabelText={label}
        errorText={emailError}
        floatingLabelFixed
        fullWidth
        floatingLabelStyle={textInputFloatingLabelStyle}
        inputStyle={textInputStyle}
        underlineFocusStyle={textInputUnderlineFocusStyle}
        type='email'
        required
        ref={inputRef}
        value={email}
        onChange={this.handleEmailChanged}
        disabled={disabled}
      />
    )
  }
}

EmailInput.propTypes = {
  label: PropTypes.string.isRequired,
  onEmailChanged: PropTypes.func.isRequired,
  invalidEmails: PropTypes.array,
  invalidReasonMessage: PropTypes.string,
  onValidityChanged: PropTypes.func,
  email: PropTypes.string,
  disabled: PropTypes.bool,
  inputRef: PropTypes.func
}

export default EmailInput
