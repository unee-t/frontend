import React, { Component } from 'react'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import PropTypes from 'prop-types'
import SelectField from 'material-ui/SelectField'
import AutoComplete from 'material-ui/AutoComplete'
import RaisedButton from 'material-ui/RaisedButton'
import CircularProgress from 'material-ui/CircularProgress'
import MenuItem from 'material-ui/MenuItem'
import Checkbox from 'material-ui/Checkbox'
import { goBack } from 'react-router-redux'
import countries from 'iso-3166-1-codes'

import InnerAppBar from '../components/inner-app-bar'
import InputRow from '../components/input-row'
import ErrorDialog from '../dialogs/error-dialog'
import { possibleRoles } from '../../api/unit-roles-data'
import { unitTypes } from '../../api/unit-meta-data'
import { createUnit, clearError } from './unit-wizard.actions'

import { controlLabelStyle } from '../components/form-controls.mui-styles'

const mandatoryFields = [
  'type',
  'name',
  'role'
]

const allCreationFields = [
  'type',
  'name',
  'role',
  'moreInfo',
  'streetAddress',
  'city',
  'state',
  'zipCode',
  'country',
  'isOccupant'
]

const objectTypeFields = [
  'type',
  'role'
]

const countryList = countries.map(({ alpha2: code, name }) => {
  // Manual ellipsis
  const displayName = name.length > 34 // max tested length on an iphone 5 screen width
    ? name.slice(0, 31) + '...'
    : name
  return (
    {
      text: displayName,
      value: (
        <MenuItem key={code} value={code} primaryText={displayName} />
      )
    }
  )
})

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
      isOccupant: false,
      searchText: null,
      countryValid: null
    }
  }
  createTextStateHandler = stateVarName => evt => this.setState({
    [stateVarName]: evt.target.value
  })

  checkIsFormInvalid () {
    return !!mandatoryFields.find(fName => !this.state[fName])
  }
  handleAddClicked = () => {
    const creationObject = allCreationFields.reduce((all, fieldName) => {
      all[fieldName] = objectTypeFields.includes(fieldName) ? this.state[fieldName].name : this.state[fieldName]
      return all
    }, {})
    this.props.dispatch(createUnit(creationObject))
  }

  handleUpdateInput = (value) => {
    this.setState({
      countryValid: null,
      searchText: value
    })
  }
  handleNewRequest = () => {
    const countryNameChecker = countries.filter(x => x.name === this.state.searchText)
    if (countryNameChecker.length === 0) {
      this.setState({
        countryValid: 'Check country name again.',
        searchText: ''
      })
    } else {
      this.setState({
        country: this.state.searchText
      })
    }
  }

  render () {
    const { name, type, role, moreInfo, streetAddress, city, zipCode, state, isOccupant } = this.state
    const { inProgress, error, dispatch } = this.props
    return (
      <div className='full-height flex flex-column overflow-hidden'>
        <InnerAppBar title='Enter Unit Details' onBack={() => dispatch(goBack())} />
        <form className='overflow-auto flex-grow flex flex-column'>
          <div className='flex-grow bg-very-light-gray'>
            <div className='bg-white card-shadow-1 pa3'>
              <InputRow
                label='Unit Name'
                value={name}
                disabled={inProgress}
                onChange={this.createTextStateHandler('name')}
              />
              <p className='f7 gray ma0 mt1'>This will be displayed to everyone involved in the unit.</p>
              <SelectField
                value={type}
                floatingLabelText='Unit Type'
                disabled={inProgress}
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
                disabled={inProgress}
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
                  disabled={inProgress}
                  onCheck={(evt, isChecked) => { this.setState({isOccupant: isChecked}) }}
                />
              )}
              <InputRow
                label='Additional Description'
                value={moreInfo}
                disabled={inProgress}
                onChange={this.createTextStateHandler('moreInfo')}
                isMultiLine
              />
            </div>
            <div className='bg-white card-shadow-1 pa3 mt3'>
              <div className='mt1 silver fw5'>ADDRESS</div>
              <InputRow
                label='Address'
                value={streetAddress}
                disabled={inProgress}
                onChange={this.createTextStateHandler('streetAddress')}
                isMultiLine
              />
              <InputRow
                label='City'
                value={city}
                disabled={inProgress}
                onChange={this.createTextStateHandler('city')}
              />
              <AutoComplete
                floatingLabelText='Country'
                fullWidth
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                targetOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                filter={AutoComplete.caseInsensitiveFilter}
                maxSearchResults={4}
                onNewRequest={this.handleNewRequest}
                dataSource={countryList}
                onUpdateInput={this.handleUpdateInput}
                searchText={this.state.searchText}
                errorText={this.state.countryValid}
              />
              <InputRow
                label='Administrative Region'
                value={state}
                disabled={inProgress}
                onChange={this.createTextStateHandler('state')}
              />
              <p className='f7 gray ma0 mt1'>State, province, prefecture, etc.</p>
              <InputRow
                label='ZIP / Postal Code'
                value={zipCode}
                disabled={inProgress}
                onChange={this.createTextStateHandler('zipCode')}
              />
            </div>
          </div>
        </form>
        <RaisedButton
          className='mt3'
          fullWidth
          primary
          disabled={this.checkIsFormInvalid() || inProgress}
          onClick={this.handleAddClicked}
        >
          {inProgress ? (
            <div className='absolute top-0 right-0 bottom-0 left-0'>
              <CircularProgress color='white' size={30} />
            </div>
          ) : (
            <div className='f4 white'>Add Unit</div>
          )}
        </RaisedButton>
        <ErrorDialog show={!!error} text={error || ''} onDismissed={() => dispatch(clearError())} />
      </div>
    )
  }
}

UnitWizard.propTypes = {
  inProgress: PropTypes.bool.isRequired,
  error: PropTypes.object
}

export default connect(
  ({ unitCreationState }) => Object.assign({}, unitCreationState) // map redux state to props
)(createContainer(() => ({ // map meteor state to props
}), UnitWizard))
