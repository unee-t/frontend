import React, { Component } from 'react'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import InnerAppBar from '../components/inner-app-bar'
import InputRow from '../components/input-row'
import SelectField from 'material-ui/SelectField'
import RaisedButton from 'material-ui/RaisedButton'
import MenuItem from 'material-ui/MenuItem'
import { goBack } from 'react-router-redux'

class UnitWizard extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      type: '',
      relationship: ''
    }
  }
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
        <InnerAppBar title='Add Unit' onBack={() => this.props.dispatch(goBack())} />
        <form onSubmit={this.handleSubmit} className='overflow-auto flex-grow flex flex-column'>
          <div className='flex-grow bg-very-light-gray'>
            <div className='bg-white card-shadow-1 pa3'>
              <InputRow label='Unit Name' onChange={this.handleUnitNameChange} />
              <p className='f7 gray ma0 mt1'>This will be displayed to everyone involved in the unit.</p>
              <SelectField
                value={this.state.type}
                floatingLabelText='Unit Type'
                fullWidth
                onChange={(evt, idx, val) => {
                  this.setState({
                    type: val
                  })
                }}
              >
                <MenuItem value='apartment' primaryText='Apartment' />
                <MenuItem value='house' primaryText='House' />
                <MenuItem value='absolute' primaryText='Absolute' />
              </SelectField>
              <SelectField
                floatingLabelText='Relationship to Unit'
                fullWidth
                value={this.state.relationship}
                onChange={(evt, idx, val) => {
                  this.setState({
                    relationship: val
                  })
                }}
              >
                <MenuItem value='owner' primaryText='Owner' />
                <MenuItem value='tenant' primaryText='Tenant' />
                <MenuItem value='occupant' primaryText='Occupant' />
                <MenuItem value='contractor' primaryText='Contractor' />
                <MenuItem value='agent' primaryText='Agent' />
                <MenuItem value='other' primaryText='Other' />
              </SelectField>
              <InputRow label='Additional Description' onChange={this.handleAdditionalDescriptionChange} />
            </div>
            <div className='bg-white card-shadow-1 pa3 mt2'>
              <div key='label' className='mt1 f6 bondi-blue'>Address</div>
              <InputRow label='Address' onChange={this.handleAddressChange} />
              <InputRow label='City' onChange={this.handleCityChange} />
              <SelectField
                floatingLabelText='Country'
                fullWidth
              ></SelectField>
              <SelectField
                floatingLabelText='State'
              ></SelectField>
              <InputRow label='ZIP / Postal Code' onChange={this.handleZipChange} />
            </div>
          </div>
          <RaisedButton
            label='Add Unit'
            type='submit'
          />
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
