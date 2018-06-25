import React, { Component } from 'react'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import InnerAppBar from '../components/inner-app-bar'
import InputRow from '../components/input-row'
import SelectField from 'material-ui/SelectField'
import RaisedButton from 'material-ui/RaisedButton'
import MenuItem from 'material-ui/MenuItem'
import { goBack } from 'react-router-redux'
import countries from 'iso-3166-1-codes'

class UnitWizard extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      type: null,
      name: '',
      role: null,
      moreInfo: '',
      streetAddress: '',
      city: '',
      state: '',
      zipCode: '',
      country: null
    }
  }
  handleSubmit = evt => {
  }
  createTextStateHandler = stateVarName => evt => this.setState({
    [stateVarName]: evt.target.value
  })
  render () {
    const { name, type, role, moreInfo, streetAddress, city, zipCode, country, state } = this.state
    return (
      <div className='full-height flex flex-column overflow-hidden'>
        <InnerAppBar title='Add Unit' onBack={() => this.props.dispatch(goBack())} />
        <form onSubmit={this.handleSubmit} className='overflow-auto flex-grow flex flex-column'>
          <div className='flex-grow bg-very-light-gray'>
            <div className='bg-white card-shadow-1 pa3'>
              <InputRow label='Unit Name' value={name} onChange={this.createTextStateHandler('name')} />
              <p className='f7 gray ma0 mt1'>This will be displayed to everyone involved in the unit.</p>
              <SelectField
                value={type}
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
                value={role}
                onChange={(evt, idx, val) => {
                  this.setState({
                    role: val
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
              <InputRow
                label='Additional Description'
                value={moreInfo}
                onChange={this.createTextStateHandler('moreInfo')}
              />
            </div>
            <div className='bg-white card-shadow-1 pa3 mv3'>
              <div className='mt1 silver fw5'>ADDRESS</div>
              <InputRow label='Address' value={streetAddress} onChange={this.createTextStateHandler('streetAddress')} />
              <InputRow label='City' value={city} onChange={this.createTextStateHandler('city')} />
              <SelectField
                floatingLabelText='Country'
                fullWidth
                value={country}
                onChange={(evt, idx, val) => {
                  this.setState({
                    country: val
                  })
                }}
              >
                {countries.map(({ alpha2: code, name }) => (
                  <MenuItem key={code} value={code} primaryText={name} />
                ))}
              </SelectField>
              <InputRow label='Administrative Region' value={state} onChange={this.createTextStateHandler('state')} />
              <p className='f7 gray ma0 mt1'>State, province, prefecture, etc.</p>
              <InputRow label='ZIP / Postal Code' value={zipCode} onChange={this.createTextStateHandler('zipCode')} />
              <RaisedButton
                fullWidth
                type='submit'
                primary
                className='mv3'
              >
                <div className='f4 white'>Add Unit</div>
              </RaisedButton>
            </div>
          </div>
        </form>
      </div>
    )
  }
}

export default connect(
  () => ({}) // map redux state to props
)(createContainer(() => ({ // map meteor state to props
}), UnitWizard))
