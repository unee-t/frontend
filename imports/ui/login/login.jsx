import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import PropTypes from 'prop-types'
import RaisedButton from 'material-ui/RaisedButton'
import actions from './login.actions'
import { emailValidator } from '../../util/validators'
import { UneeTIcon, UneeTLogoText } from '../components/unee-t-icons'

import InputRow from '../components/input-row'
import PasswordInput from '../components/password-input'

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
      <div className='w-100 bg-bondi-blue full-height pt5 roboto'>
        <main className='measure-narrow center tc'>
          <div className='bg-white br3 pv4 ph3'>
            <div className='flex items-center justify-center pb1'>
              <UneeTLogoText sizeMultiplier={1.7} textColor='var(--bondi-blue)' />
              <UneeTIcon className='ml2' isDarkType style={{width: '3rem', height: '3rem'}} />
            </div>
            <h3 className='f4 fw3 ph0 mh0 mt3 pt2 tc mid-gray'>Please login to continue</h3>
            <form onSubmit={this.handleSubmit} ref={el => { this.loginForm = el }}>
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
                  <a href='#0' className='f6 link dim bondi-blue db'>Forgot password?</a>
                </div>
                <RaisedButton label='Login' labelColor='white' backgroundColor='var(--bondi-blue)' type='submit'
                  disabled={!password || !email || emailError}
                />
              </div>
            </form>
          </div>
          <div className='mt3 f6 white lh-title'>
            Don't have an account?&nbsp;
            <Link className='link dim b white' to='/signup'>Sign up for one here</Link>
            <br />
            It's FREE!
          </div>
        </main>
      </div>
    )
  }

  // renderSocialSignupLink (type) {
  //   return (
  //     <a href='#1' className='link dim mr3'>
  //       <svg viewBox='0 0 16 16' className='dib h2 w2'>
  //         <use xlinkHref={`icons.svg#${type}`} />
  //       </svg>
  //     </a>
  //   )
  // }
}

LoginPage.propTypes = {
  showLoginError: PropTypes.string
}

export default connect(
  ({showLoginError}) => ({showLoginError}) // map redux state to props
)(createContainer(() => ({ // map meteor state to props
}), LoginPage))
