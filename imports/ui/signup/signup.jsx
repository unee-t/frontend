import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { createContainer } from 'meteor/react-meteor-data'
import { connect } from 'react-redux'
import RaisedButton from 'material-ui/RaisedButton'

import InputRow from '../components/input-row'
import PasswordInput from '../components/password-input'
import actions from './signup.actions'
import LoginLayout from '../layouts/login-layout'
import { emailValidator } from '../../util/validators'

export class SignupPage extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      existingBz: false,
      info: {
        password: '',
        bzLogin: '',
        bzPass: ''
      },
      errorTexts: {}
    }

    this.inputs = [
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
        type: 'email',
        onChange: evt => {
          const { value } = evt.target
          const { info, errorTexts } = this.state
          this.setState({
            info: Object.assign({}, info, {emailAddress: value}),
            errorTexts: Object.assign({}, errorTexts, {
              emailAddress: emailValidator(value) ? null : 'Email address is invalid'
            })
          })
        }
      }
    ]

    this.inputs.forEach(({identifier}) => { this.state.info[identifier] = '' })
  }

  makeInfoChange = infoMod => this.setState({
    info: Object.assign({}, this.state.info, infoMod)
  })

  handleSubmit = (event) => {
    // Stopping default form behavior
    event.preventDefault()
    if (!this.isFormValid()) return

    const { info } = this.state

    // Copying all the input values and trimming them
    const signupInfo = Object.keys(info).reduce((all, curr) => {
      if (info[curr]) {
        all[curr] = info[curr].trim()
      }
      return all
    }, {})
    const { submitSignupInfo } = actions
    this.props.dispatch(submitSignupInfo(signupInfo))
  }
  toggleExistingBz = () => {
    this.setState({
      existingBz: !this.state.existingBz
    })
  }
  isFormValid = () => {
    const { info, errorTexts, existingBz } = this.state
    return (
      this.inputs.filter(({identifier}) => !!info[identifier]).length === this.inputs.length && // All have a value
      Object.keys(errorTexts).filter(key => !!errorTexts[key]).length === 0 && // No error messages
      !!info.password && // Password has a value
      (!existingBz || (!!info.bzLogin && !!info.bzPass)) // Not a BZ user, or is but creds are filled
    )
  }
  render () {
    const { info, existingBz, errorTexts } = this.state
    return (
      <LoginLayout subHeading='Sign up'
        footerContent={
          <div>
            Already registered?
            <Link className='f6 link dim b white' to='/'> Log in!</Link>
          </div>
        }
      >
        <form className='measure center' onSubmit={this.handleSubmit}>
          <fieldset id='sign_up' className='ba b--transparent ph0 mh0'>
            <label className='pa0 ma0 lh-copy f6 pointer mid-gray'>
              <input type='checkbox' checked={existingBz} onChange={this.toggleExistingBz} /> Existing Bugzilla user?
            </label>
            {existingBz && (
              <div className='ph3 b--black b--solid'>
                <h4>Bugzilla credentials</h4>
                <InputRow label='BZ login name' value={info.bzLogin} onChange={evt => this.makeInfoChange({
                  bzLogin: evt.target.value
                })} />
                <InputRow label='BZ password' inpType='password' value={info.bzPass}
                  onChange={evt => this.makeInfoChange({bzPass: evt.target.value})} />
              </div>
            )}
            {this.inputs.map(({label, identifier, placeholder, type, onChange}, i) => (
              <InputRow key={i} label={label} placeholder={placeholder} inpType={type} value={info[identifier]}
                onChange={evt => onChange ? onChange(evt) : this.makeInfoChange({[identifier]: evt.target.value})}
                errorText={errorTexts[identifier]}
              />
            ))}
            <PasswordInput value={info.password} onChange={evt => this.makeInfoChange({password: evt.target.value})} />
          </fieldset>
          <div className='mt3 tr'>
            <RaisedButton label='Submit' labelColor='white' backgroundColor='var(--bondi-blue)' type='submit'
              disabled={!this.isFormValid()}
            />
          </div>
        </form>
      </LoginLayout>
    )
  }
}

SignupPage.propTypes = {}

export default connect(
  (state) => ({}) // map redux state to props
)(createContainer(() => ({}), SignupPage)) // map meteor state to props
