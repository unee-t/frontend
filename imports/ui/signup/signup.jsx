import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { createContainer } from 'meteor/react-meteor-data'
import { connect } from 'react-redux'
import RaisedButton from 'material-ui/RaisedButton'
import Checkbox from 'material-ui/Checkbox'
import InputRow from '../components/input-row'
import PasswordInput from '../components/password-input'
import actions from './signup.actions'
import LoginLayout from '../layouts/login-layout'
import { emailValidator } from '../../util/validators'

export class SignupPage extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      termsAgreement: false,
      info: {
        password: ''
      },
      errorTexts: {}
    }

    this.inputs = [
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

  isFormValid = () => {
    const { info, errorTexts, termsAgreement } = this.state
    return (
      this.inputs.filter(({identifier}) => !!info[identifier]).length === this.inputs.length && // All have a value
      Object.keys(errorTexts).filter(key => !!errorTexts[key]).length === 0 && // No error messages
      !!info.password && // Password has a value
      !!termsAgreement
    )
  }
  render () {
    const { info, errorTexts, termsAgreement } = this.state
    const { showSignupError } = this.props

    return (
      <LoginLayout subHeading='Sign up for a free account!'
        footerContent={
          <div>
            Already registered?
            <Link className='f6 link dim b white' to='/'> Log in!</Link>
          </div>
        }
      >
        <form className='measure center' onSubmit={this.handleSubmit}>
          <fieldset id='sign_up' className='ba b--transparent ph0 mh0'>
            <div className='relative'>
              {this.inputs.map(({label, identifier, placeholder, type, onChange}, i) => (
                <InputRow key={i} label={label} placeholder={placeholder} inpType={type} value={info[identifier]}
                  onChange={evt => onChange ? onChange(evt) : this.makeInfoChange({[identifier]: evt.target.value})}
                  errorText={errorTexts[identifier] || showSignupError.includes('Email') ? ('Email already exists in Unee-T.') : (showSignupError)}
                />
              ))}
              {showSignupError.includes('Email') &&
              (<div className='f7 absolute bottom-0 left-2 error-red'>
                You can <Link className='link dim b error-red' to='/forgot-pass'>
                reset your password </Link> if needed.
              </div>)}
            </div>
            <PasswordInput value={info.password} onChange={evt => this.makeInfoChange({password: evt.target.value})} />
          </fieldset>
          <div className='f7 gray mt3 lh-copy'>
            <label className='pa0 ma0 lh-copy f6 pointer mid-gray'>
              <Checkbox
                checked={termsAgreement}
                label='By signing up, you agree to our'
                onCheck={(evt, isChecked) => { this.setState({termsAgreement: isChecked}) }}
              />
              <a className='link bondi-blue fw8 pl3' target='_blank' href='https://unee-t.com/privacy-and-terms/'>
            Terms of Service &amp; Privacy Policy
              </a>
            </label>
          </div>
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
  ({showSignupError}) => ({showSignupError}) // map redux state to props
)(createContainer(() => ({}), SignupPage)) // map meteor state to props
