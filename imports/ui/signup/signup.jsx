import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { createContainer } from 'meteor/react-meteor-data'
import { connect } from 'react-redux'

import InputRow from '../components/input-row'
import PasswordInput from '../components/password-input'
import { submitSignupInfo } from './signup.actions'

class SignupPage extends Component {
  constructor () {
    super(...arguments)
    this.info = {}
  }
  setMember (memName, el) {
    this.info[memName] = el
  }
  handleSubmit (event) {
    event.preventDefault()
    const signupInfo = Object.keys(this.info).reduce((all, curr) => {
      all[curr] = this.info[curr].value.trim()
      return all
    }, {})
    this.props.dispatch(submitSignupInfo(signupInfo))
  }
  render () {
    const inputs = [
      {
        label: 'Name',
        identifier: 'fullName',
        placeholder: 'Your name'
      },
      {
        label: 'Phone',
        identifier: 'phoneNumber',
        placeholder: 'Your phone number'
      },
      {
        label: 'Country',
        identifier: 'country',
        placeholder: 'Country of residence'
      },
      {
        label: 'Email',
        identifier: 'emailAddress',
        placeholder: 'Your email address',
        type: 'email'
      }
    ]
    return (
      <div className='w-100'>
        <main className='pa4 black-80'>
          <h2 className='f3 fw6 ph0 mh0 tc'>Unee-T</h2>
          <h3 className='f4 fw3 ph0 mh0 tc'>Sign up</h3>
          <form className='measure center' onSubmit={this.handleSubmit.bind(this)}>
            <fieldset id='sign_up' className='ba b--transparent ph0 mh0'>
              {inputs.map(({label, identifier, placeholder, type}, i) => (
                <InputRow key={i} label={label} identifier={identifier} placeholder={placeholder} inpType={type} inpRef={el => this.setMember(identifier, el)} />
                ))}
              <PasswordInput inpRef={el => this.setMember('password', el)} />
            </fieldset>
            <div className='tc'>
              <input className='b ph3 pv2 input-reset ba b--black bg-transparent grow pointer f6 dib' type='submit' value='Submit' />
            </div>
            <div className='lh-copy mt3'>
              <Link className='f6 link dim black db' to='/'>Already registered? Log in!</Link>
            </div>
          </form>
        </main>
      </div>
    )
  }
}

SignupPage.propTypes = {}

export default connect(
  (state) => ({}) // map redux state to props
)(createContainer(() => ({}), SignupPage)) // map meteor state to props
