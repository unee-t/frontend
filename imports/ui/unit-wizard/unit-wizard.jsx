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
      <div className='full-height flex flex-column overflow-hidden'>
        <InnerAppBar title='Add Unit'></InnerAppBar>
        <form onSubmit={this.handleSubmit} className='overflow-auto flex-grow flex flex-column'>
          <div className='flex-grow'>
            <InputRow label='Unit Name*' onChange={this.handleUnitNameChange} />
            <SelectField>
            </SelectField>
            <InputRow label='Additional Description' onChange={this.handleAdditionalDescriptionChange} />
            <div className='bb b--gray-93 ph3 pt2 pb3'>
              <div key='label' className='mt1 f6 bondi-blue'>Address</div>
              <InputRow label='Address' onChange={this.handleAddressChange} />
              <InputRow label='City' onChange={this.handleCityChange} />
              <SelectField>
              </SelectField>
              <SelectField>
              </SelectField>
              <InputRow label='Zip / Postal code' onChange={this.handleZipChange} />
            </div>
          </div>
          <h1>fasdasf</h1>
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
