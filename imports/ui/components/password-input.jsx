import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class PasswordInput extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      showPass: false
    }
  }

  toggleShowPass () {
    this.setState({
      showPass: !this.state.showPass
    })
  }

  render () {
    return (
      <div>
        <div className='mv3'>
          <label className='db fw6 lh-copy f6' htmlFor='password'>Password</label>
          <input className='pa2 input-reset ba bg-transparent w-100 b' ref={this.props.inpRef} type={this.state.showPass ? 'text' : 'password'} name='password' />
        </div>
        <label className='pa0 ma0 lh-copy f6 pointer'>
          <input type='checkbox' checked={this.state.showPass} onChange={this.toggleShowPass.bind(this)} /> Show password
        </label>
      </div>
    )
  }
}

PasswordInput.propTypes = {
  inpRef: PropTypes.func.isRequired
}
