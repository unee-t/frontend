// @flow
/* global SyntheticInputEvent, HTMLInputElement */
import * as React from 'react'
import { Link } from 'react-router-dom'
import { createContainer } from 'meteor/react-meteor-data'
import { connect } from 'react-redux'
import RaisedButton from 'material-ui/RaisedButton'
import Checkbox from 'material-ui/Checkbox'
import InputRow from '../components/input-row'
import PasswordInput from '../components/password-input'
import { submitSignupInfo } from './signup.actions'
import LoginLayout from '../layouts/login-layout'
import { emailValidator } from '../../util/validators'
import CircularProgress from 'material-ui/CircularProgress'

type Props = {
  dispatch: (action: {}) => void,
  userCreationState: {
    inProgress: boolean,
    error: string
  }
 }

type State = {
  termsAgreement: boolean,
  info: {
    password: string,
    emailAddress: string
  },
  errorTexts: {}
}

type Inputs = Array<{
  label: string,
  identifier: string,
  placeholder: string,
  type: string,
  onChange: (evt: SyntheticInputEvent<HTMLInputElement>) => void
}>

export class SignupPage extends React.Component<Props, State> {
  inputs: Inputs

  constructor () {
    super(...arguments)
    this.state = {
      termsAgreement: false,
      info: {
        password: '',
        emailAddress: ''
      },
      errorTexts: {}
    }

    this.inputs = [
      {
        label: 'Email',
        identifier: 'emailAddress',
        placeholder: 'Your email address',
        type: 'email',
        onChange: (evt) => {
          const { value } = evt.target
          const { info, errorTexts } = this.state
          this.setState({
            info: Object.assign({}, info, { emailAddress: value }),
            errorTexts: Object.assign({}, errorTexts, {
              emailAddress: emailValidator(value) ? null : 'Email address is invalid'
            })
          })
        }
      }
    ]

    this.inputs.forEach(({ identifier }) => { this.state.info[identifier] = '' })
  }

  makeInfoChange = (infoMod: {}) => this.setState({
    info: Object.assign({}, this.state.info, infoMod)
  })

  handleSubmit = (event: SyntheticInputEvent<HTMLInputElement>) => {
    // Stopping default form behavior
    event.preventDefault()
    if (!this.isFormValid()) return

    const { info } = this.state
    // Copying all the input values and trimming them
    const signupInfo: Object = Object.keys(info).reduce((all, curr) => {
      if (info[curr]) {
        all[curr] = info[curr].trim()
      }
      return all
    }, {})
    this.props.dispatch(submitSignupInfo(signupInfo))
  }

  isFormValid = () => {
    const { info, errorTexts, termsAgreement } = this.state
    return (
      this.inputs.filter(({ identifier }) => !!info[identifier]).length === this.inputs.length && // All have a value
      Object.keys(errorTexts).filter(key => !!errorTexts[key]).length === 0 && // No error messages
      !!info.password && // Password has a value
      !!termsAgreement
    )
  }
  render () {
    const { info, errorTexts, termsAgreement } = this.state
    const { userCreationState } = this.props
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
              {this.inputs.map(({ label, identifier, placeholder, type, onChange }, i) => (
                <InputRow key={i} label={label} placeholder={placeholder} inpType={type} value={info[identifier]}
                  onChange={evt => onChange ? onChange(evt) : this.makeInfoChange({ [identifier]: evt.target.value })}
                  errorText={errorTexts[identifier] || userCreationState.error}
                />
              ))}
              {userCreationState.error && userCreationState.error.includes('Email') &&
              (<div className='f7 absolute bottom-0 left-2 error-red'>
                You can <Link className='link dim b error-red' to='/forgot-pass'>
                reset your password </Link> if needed.
              </div>)}
            </div>
            <PasswordInput value={info.password} onChange={evt => this.makeInfoChange({ password: evt.target.value })} />
          </fieldset>
          <div className='f7 gray mt3 lh-copy'>
            <label className='pa0 ma0 lh-copy f6 pointer mid-gray'>
              <Checkbox
                checked={termsAgreement}
                label='By signing up, you agree to our'
                onCheck={(evt, isChecked) => { this.setState({ termsAgreement: isChecked }) }}
              />
              <a className='link bondi-blue fw8 pl3' target='_blank' href='https://unee-t.com/privacy-and-terms/'>
            Terms of Service &amp; Privacy Policy
              </a>
            </label>
          </div>
          <div className='mt3 tr'>
            <RaisedButton label={!userCreationState.inProgress && 'submit'} labelColor='#ffffff' backgroundColor='var(--bondi-blue)' type='submit'
              style={{ boxShadow: 'none' }}
              disabled={!this.isFormValid() || userCreationState.inProgress}>
              {userCreationState.inProgress && (
                <div className='absolute top-0 right-0 bottom-0 left-0'>
                  <CircularProgress color='#ffffff' size={30} />
                </div>
              )
              }
            </RaisedButton>
          </div>
        </form>
      </LoginLayout>
    )
  }
}

SignupPage.propTypes = {}

export default connect(
  ({ userCreationState }) => ({ userCreationState }) // map redux state to props
)(createContainer(() => ({}), SignupPage)) // map meteor state to props
