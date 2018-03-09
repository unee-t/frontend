import React, { Component } from 'react'
import PropTypes from 'prop-types'
import TextField from 'material-ui/TextField'

import {
  textInputStyle,
  textInputFloatingLabelStyle,
  textInputUnderlineFocusStyle
} from '../components/form-controls.mui-styles'

export default class EditableItem extends Component {
  constructor (props) {
    super(props)
    this.state = {
      value: props.initialValue || ''
    }
    this.lastEditTime = 0
  }
  componentWillReceiveProps (nextProps) {
    if (nextProps.initialValue !== this.props.initialValue && Date.now() - this.lastEditTime > 2000) {
      this.setState({value: nextProps.initialValue})
    }
  }
  handleEdit = ({ target: { value } }) => {
    this.setState({value})
    this.lastEditTime = Date.now()
    this.props.onEdit(value)
  }
  render () {
    const { label, isMultiLine } = this.props
    const { value } = this.state
    return (
      <TextField
        floatingLabelText={label}
        floatingLabelShrinkStyle={textInputFloatingLabelStyle}
        floatingLabelFixed
        underlineFocusStyle={textInputUnderlineFocusStyle}
        inputStyle={textInputStyle}
        fullWidth
        multiLine={isMultiLine}
        value={value}
        onChange={this.handleEdit}
      />
    )
  }
}
EditableItem.propTypes = {
  label: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
  isMultiLine: PropTypes.bool,
  initialValue: PropTypes.string
}
