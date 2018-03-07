import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Checkbox from 'material-ui/Checkbox'
import FontIcon from 'material-ui/FontIcon'
import InputRow from './input-row'

export default class PasswordInput extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      showPass: false
    }
  }

  render () {
    const { label, inpRef, onChange, value } = this.props
    return (
      <div className='relative'>
        <InputRow
          label={label || 'Password'} {...{inpRef, onChange, value}}
          inpType={this.state.showPass ? 'text' : 'password'}
        />
        <div className='absolute bottom-1 right-0 tl'>
          <Checkbox
            checked={this.state.showPass}
            onCheck={(evt, isChecked) => this.setState({showPass: isChecked})}
            checkedIcon={<FontIcon color='var(--bondi-blue)' className='material-icons'>visibility</FontIcon>}
            uncheckedIcon={<FontIcon className='material-icons'>visibility_off</FontIcon>}
          />
        </div>
      </div>
    )
  }
}

PasswordInput.propTypes = {
  inpRef: PropTypes.func,
  label: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired
}
