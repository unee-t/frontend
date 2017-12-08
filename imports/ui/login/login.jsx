import React, { Component } from 'react'
import { Link, Redirect } from 'react-router-dom'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import { Meteor } from 'meteor/meteor'
import actions from './login.actions'
import PropTypes from 'prop-types'

import InputRow from '../components/input-row'
import PasswordInput from '../components/password-input'

export class LoginPage extends Component {
  handleSubmit (event) {
    event.preventDefault()
    const email = this.emailInput.value.trim()
    const pass = this.passInput.value.trim()
    const { submitCredentials } = actions
    this.props.dispatch(submitCredentials(email, pass))
  }
  // Handles setting members on the component as "standard" doesn't allow for assignment as return values in handlers
  setMember (memName, el) {
    this[memName] = el
  }
  render () {
    if (this.props.loggedIn) {
      return <Redirect to='/case' />
    }
    return (
      <div className='w-100'>
        <main className='pa4 black-80'>
          <h2 className='f3 fw6 ph0 mh0 tc'>Unee-T</h2>
          <h3 className='f4 fw3 ph0 mh0 tc'>Login with</h3>
          <div className='measure center tc'>
            {this.renderSocialSignupLink('facebook')}
            {this.renderSocialSignupLink('google-plus')}
            {this.renderSocialSignupLink('linked-in')}
          </div>
          <h3 className='f4 fw6 ph0 mh0 tc'>Or</h3>
          <form className='measure center' onSubmit={this.handleSubmit.bind(this)}>
            <fieldset id='sign_up' className='ba b--transparent ph0 mh0'>
              <InputRow label='Email' identifier='email-address' inpRef={el => this.setMember('emailInput', el)} inpType='email' />
              <PasswordInput inpRef={el => this.setMember('passInput', el)} />
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

  renderSocialSignupLink (type) {
    return (
      <a href='#1' className='link dim mr3'>
        <svg viewBox='0 0 16 16' className='dib h2 w2'>
          <use xlinkHref={`icons.svg#${type}`} />
        </svg>
      </a>
    )
  }
}

LoginPage.propTypes = {
  showLoginError: PropTypes.string,
  loggedIn: PropTypes.bool
}

export default connect(
  ({showLoginError}) => ({showLoginError}) // map redux state to props
)(createContainer(() => ({ // map meteor state to props
  loggedIn: !!Meteor.user()
}), LoginPage))
