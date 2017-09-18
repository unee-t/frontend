import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class InputRow extends Component {
  render () {
    const type = this.props.inpType || 'text'
    const inputClasses = 'pa2 input-reset ba bg-transparent w-100' + (this.props.inpAdditionalClass ? ' ' + this.props.inpAdditionalClass : '')
    return (
      <div className='mv3'>
        <label className='db fw6 lh-copy f6' htmlFor={this.props.identifier}>{this.props.label}</label>
        <input className={inputClasses} ref={this.props.inpRef} type={type} name={this.props.identifier} id={this.props.identifier} placeholder={this.props.placeholder} />
      </div>
    )
  }
}

InputRow.propTypes = {
  label: PropTypes.string.isRequired,
  identifier: PropTypes.string.isRequired,
  inpRef: PropTypes.func,
  inpType: PropTypes.string,
  inpAdditionalClass: PropTypes.string,
  placeholder: PropTypes.string
}
