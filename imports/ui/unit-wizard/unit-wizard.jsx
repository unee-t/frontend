import React, { Component } from 'react'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import SelectField from 'material-ui/SelectField'
import RaisedButton from 'material-ui/RaisedButton'
import MenuItem from 'material-ui/MenuItem'
import Checkbox from 'material-ui/Checkbox'
import { goBack } from 'react-router-redux'
import countries from 'iso-3166-1-codes'

import InnerAppBar from '../components/inner-app-bar'
import InputRow from '../components/input-row'
import { possibleRoles } from '../../api/unit-roles-data'
import { unitTypes } from '../../api/unit-meta-data'

import { controlLabelStyle } from '../components/form-controls.mui-styles'

const mandatoryFields = [
  'type',
  'name',
  'role'
]

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
      country: null,
      isOccupant: false
    }
  }
  createTextStateHandler = stateVarName => evt => this.setState({
    [stateVarName]: evt.target.value
  })
  checkIsFormInvalid () {
    return mandatoryFields.find(fName => !this.state[fName])
  }
  render () {
    const { name, type, role, moreInfo, streetAddress, city, zipCode, country, state, isOccupant } = this.state
    return (
      <div className='full-height flex flex-column overflow-hidden'>
        <InnerAppBar title='Add Unit' onBack={() => this.props.dispatch(goBack())} />
        <form className='overflow-auto flex-grow flex flex-column'>
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
                {unitTypes.map(type => (
                  <MenuItem key={type.name} value={type} primaryText={type.name} />
                ))}
              </SelectField>
              <SelectField
                floatingLabelText='Relationship to Unit'
                fullWidth
                value={role}
                onChange={(evt, idx, val) => {
                  this.setState({
                    role: val,
                    isOccupant: false
                  })
                }}
              >
                {possibleRoles.map(role => (
                  <MenuItem key={role.name} value={role} primaryText={role.name} />
                ))}
              </SelectField>
              {role && role.canBeOccupant && (
                <Checkbox
                  label='I am also the occupant of this unit'
                  labelStyle={controlLabelStyle}
                  checked={isOccupant}
                  onCheck={(evt, isChecked) => { this.setState({isOccupant: isChecked}) }}
                />
              )}
              <InputRow
                label='Additional Description'
                value={moreInfo}
                onChange={this.createTextStateHandler('moreInfo')}
              />
            </div>
            <div className='bg-white card-shadow-1 pa3 mv3'>
              <div className='mt1 silver fw5'>ADDRESS</div>
              <InputRow
                label='Address'
                value={streetAddress}
                onChange={this.createTextStateHandler('streetAddress')}
                isMultiLine
              />
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
                {countries.map(({ alpha2: code, name }) => {
                  // Manual ellipsis
                  const displayName = name.length > 34 // max tested length on an iphone 5 screen width
                    ? name.slice(0, 31) + '...'
                    : name
                  return (
                    <MenuItem key={code} value={code} primaryText={displayName} />
                  )
                })}
              </SelectField>
              <InputRow label='Administrative Region' value={state} onChange={this.createTextStateHandler('state')} />
              <p className='f7 gray ma0 mt1'>State, province, prefecture, etc.</p>
              <InputRow label='ZIP / Postal Code' value={zipCode} onChange={this.createTextStateHandler('zipCode')} />
              <RaisedButton
                fullWidth
                disabled={this.checkIsFormInvalid()}
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
