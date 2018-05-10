import React, { Component } from 'react'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import InnerAppBar from '../components/inner-app-bar'
import InputRow from '../components/input-row'
import SelectField from 'material-ui/SelectField'

class UnitWizard extends Component {
  handleSubmit = evt => {
    evt.preventDefault()
    const { email, error } = this.state
    if (!email || !!error) return

    this.props.dispatch(forgotPass(email))
  }
  handleUnitNameChange = evt => {
    const { asyncError, dispatch } = this.props
    this.setState({
      email: evt.target.value,
      error: emailValidator(evt.target.value) ? null : 'Email address is invalid'
    })
    if (asyncError) {
      dispatch(resetError())
    }
  }
  render () {
    return (
      <div>
        <InnerAppBar title='Add Unit'></InnerAppBar>
        <form onSubmit={this.handleSubmit} className='overflow-auto'>
          <InputRow label='Unit Name*' onChange={this.handleUnitNameChange} />
          <SelectField>
          </SelectField>
        </form>
      </div>
    )
  }
}

export default connect(
  ({ drawerState }) => ({isDrawerOpen: drawerState.isOpen}) // map redux state to props
)(createContainer(() => ({ // map meteor state to props
  user: Meteor.user()
}), UnitWizard))
