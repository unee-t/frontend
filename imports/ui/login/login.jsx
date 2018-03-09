import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import PropTypes from 'prop-types'
import RaisedButton from 'material-ui/RaisedButton'
import actions from './login.actions'
import { emailValidator } from '../../util/validators'
import InputRow from '../components/input-row'
import PasswordInput from '../components/password-input'
import LoginLayout from '../layouts/login-layout'

export class LoginPage extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      email: '',
      password: ''
    }
  }
  handleSubmit = evt => {
    evt.preventDefault()
    const email = this.state.email.trim()
    const pass = this.state.password.trim()
    const { submitCredentials } = actions
    this.props.dispatch(submitCredentials(email, pass))
  }

  handleEmailChanged = evt => {
    const { value } = evt.target
    this.setState({
      email: value,
      emailError: emailValidator(value) ? null : 'Email address is invalid'
    })
  }
  render () {
    const { email, password, emailError } = this.state
    return (
      <LoginLayout subHeading='Please login to continue' footerContent={
        <div>
          Don't have an account?&nbsp;
          <Link className='link dim b white' to='/signup'>Sign up for one here</Link>
          <br />
          It's FREE!
        </div>
      }>
        <form onSubmit={this.handleSubmit}>
          <fieldset id='sign_up' className='ba b--transparent ph0 mh0'>
            <InputRow label='Email' inpType='email'
              value={email}
              errorText={emailError}
              onChange={this.handleEmailChanged}
            />
            <PasswordInput
              value={password}
              onChange={evt => this.setState({password: evt.target.value})}
            />
          </fieldset>
          { this.props.showLoginError && (
            <div className='tc pv1 warn-crimson'>
              <small>Email or password do not match</small>
            </div>
          )}
          <div className='flex mt3 items-center'>
            <div className='flex-grow lh-copy tl'>
              <Link to='/forgot-pass' className='f6 link dim bondi-blue'>Forgot password?</Link>
            </div>
            <RaisedButton label='Login' labelColor='white' backgroundColor='var(--bondi-blue)' type='submit'
              disabled={!password || !email || emailError}
            />
          </div>
        </form>
      </LoginLayout>
    )
  }
}

LoginPage.propTypes = {
  showLoginError: PropTypes.string
}

export default connect(
  ({showLoginError}) => ({showLoginError}) // map redux state to props
)(createContainer(() => ({ // map meteor state to props
}), LoginPage))
