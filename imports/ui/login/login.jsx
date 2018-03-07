import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import actions from './login.actions'
import PropTypes from 'prop-types'
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
    const email = this.emailInput.value.trim()
    const pass = this.passInput.value.trim()
    const { submitCredentials } = actions
    this.props.dispatch(submitCredentials(email, pass))
  }

  handleEmailChanged = evt => {
    const { value } = evt.target
    const newState = {
      email: value
    }
    if (!emailValidator(value)) {
      newState.emailError = 'Email address is invalid'
    }
    this.setState(newState)
  }
  render () {
    const { email, password } = this.state
    return (
      <div className='w-100 bg-bondi-blue full-height pt5 roboto'>
        <main className='measure center tc bg-white br3 pv4 ph3'>
          <div className='flex items-center justify-center pb1'>
            <UneeTLogoText sizeMultiplier={1.7} textColor='var(--bondi-blue)' />
            <UneeTIcon className='ml2' isDarkType style={{width: '3rem', height: '3rem'}} />
          </div>
          <h3 className='f4 fw3 ph0 mh0 mt3 pt2 tc mid-gray'>Please login to continue</h3>
          <form onSubmit={this.handleSubmit}>
            <fieldset id='sign_up' className='ba b--transparent ph0 mh0'>
              <InputRow label='Email' inpType='email'
                value={email}
                inpRef={el => { this.emailInput = el }}
                onChange={this.handleEmailChanged}
              />
              <PasswordInput
                inpRef={el => { this.passInput = el }}
                value={password}
                onChange={evt => this.setState({password: evt.target.value})}
              />
            </fieldset>
            { this.props.showLoginError
              ? (
                <div className='tc pv1'>
                  <small>Email or password do not match</small>
                </div>
              ) : null}
            <div className='tc'>
              <input className='b ph3 pv2 input-reset ba b--black bg-transparent grow pointer f6 dib' type='submit' value='Login' />
            </div>
            <div className='lh-copy mt3'>
              <Link className='f6 link dim black db' to='/signup'>Sign up</Link>
              <a href='#0' className='f6 link dim black db'>Forgot your password?</a>
            </div>
          </form>
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
