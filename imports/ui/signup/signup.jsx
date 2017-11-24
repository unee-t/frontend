import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { createContainer } from 'meteor/react-meteor-data'
import { connect } from 'react-redux'

import InputRow from '../components/input-row'
import PasswordInput from '../components/password-input'
import actions from './signup.actions'

export class SignupPage extends Component {
  constructor () {
    super(...arguments)
    this.info = {}
    this.state = {
      existingBz: false
    }
  }
  setMember (memName, el) {
    this.info[memName] = el
  }
  handleSubmit (event) {
    // Stopping default form behavior
    event.preventDefault()
    // Copying all the input values and trimming them
    const signupInfo = Object.keys(this.info).reduce((all, curr) => {
      if (this.info[curr]) {
        all[curr] = this.info[curr].value.trim()
      }
      return all
    }, {})
    const { submitSignupInfo } = actions
    this.props.dispatch(submitSignupInfo(signupInfo))
  }
  toggleExistingBz () {
    this.setState({
      existingBz: !this.state.existingBz
    })
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
              <label className='pa0 ma0 lh-copy f6 pointer'>
                <input type='checkbox' checked={this.state.existingBz} onChange={this.toggleExistingBz.bind(this)} ref='showBZ' /> Existing BZ user?
              </label>
              {this.state.existingBz ? (
                <div className='ph3 b--black b--solid'>
                  <h4>Bugzilla credentials</h4>
                  <InputRow label='BZ login name' identifier='bzLogin' inpRef={el => this.setMember('bzLogin', el)} />
                  <InputRow label='BZ password' identifier='bzPass' inptype='password' inpRef={el => this.setMember('bzPass', el)} />
                </div>
              ) : ''}
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
