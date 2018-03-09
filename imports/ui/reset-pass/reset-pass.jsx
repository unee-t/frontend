import React, { Component } from 'react'
import { Link, Redirect } from 'react-router-dom'
import RaisedButton from 'material-ui/RaisedButton'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import PropTypes from 'prop-types'

import LoginLayout from '../layouts/login-layout'
import InputRow from '../components/input-row'
import { resetPass } from './reset-pass.actions'

class ResetPass extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      newPass: '',
      confirmPass: ''
    }
  }
  handleSubmit = evt => {
    evt.preventDefault()
    const { newPass, confirmPass, error } = this.state
    if (!newPass || !confirmPass || !!error) return
    this.props.dispatch(resetPass(newPass))
  }
  render () {
    const { newPass, confirmPass, error } = this.state
    const { isRequested, asyncError } = this.props
    if (!isRequested) {
      return <Redirect to='/' />
    }
    return (
      <LoginLayout subHeading='Reset password' footerContent={
        <div>
          Don't have an account?&nbsp;
          <Link className='link dim b white' to='/signup'>Sign up for one here</Link>
          <br />
          It's FREE!
        </div>
      }>
        <form onSubmit={this.handleSubmit}>
          <fieldset className='ba b--transparent ph0 mh0'>
            <InputRow label='New password' value={newPass} inpType='password'
              onChange={evt => this.setState({newPass: evt.target.value})}
            />
            <InputRow label='Confirm password' value={confirmPass} errorText={error || asyncError} inpType='password'
              onChange={evt => this.setState({
                confirmPass: evt.target.value,
                error: newPass !== evt.target.value ? 'The confirmation doesn\'t match' : null
              })}
            />
          </fieldset>
          <div className='mt3 tr'>
            <RaisedButton label='Save & continue' labelColor='white' backgroundColor='var(--bondi-blue)' type='submit'
              disabled={!newPass || !confirmPass || !!error}
            />
          </div>
        </form>
      </LoginLayout>
    )
  }
}

ResetPass.propTypes = {
  isRequested: PropTypes.bool,
  asyncError: PropTypes.string
}

export default connect(
  ({ passResetState: { isRequested, error } }) => ({isRequested, asyncError: error}) // map redux state to props
)(createContainer(() => ({ // map meteor state to props
}), ResetPass))
