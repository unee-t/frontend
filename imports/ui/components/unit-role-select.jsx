import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'
import Checkbox from 'material-ui/Checkbox'

import { possibleRoles } from '/imports/api/unit-roles-data'

import {
  textInputFloatingLabelStyle,
  controlLabelStyle,
  textInputStyle,
  textInputUnderlineFocusStyle,
  selectInputIconStyle
} from './form-controls.mui-styles'

class UnitRoleSelect extends Component {
  renderOptions () {
    const { availableRolesTypes } = this.props

    const relevantRoles = availableRolesTypes
      ? possibleRoles.filter(role => availableRolesTypes.includes(role.name))
      : possibleRoles
    return relevantRoles.map(type => (
      <MenuItem key={type.name} value={type} primaryText={type.name} />
    ))
  }
  render () {
    const { selectedRole, onRoleSelected, isOccupant, onOccupantToggled, disabled, showRequired } = this.props
    return (
      <div>
        <SelectField
          floatingLabelText='Relationship to this unit'
          floatingLabelFixed
          fullWidth
          floatingLabelStyle={textInputFloatingLabelStyle}
          labelStyle={textInputStyle}
          menuStyle={textInputStyle}
          iconStyle={selectInputIconStyle}
          underlineFocusStyle={textInputUnderlineFocusStyle}
          value={selectedRole}
          onChange={(evt, idx, val) => {
            onRoleSelected(val)
            onOccupantToggled(false)
          }}
          disabled={disabled}
          errorText={showRequired ? 'Select a role before proceeding' : ''}
        >
          {this.renderOptions()}
        </SelectField>
        {selectedRole && selectedRole.canBeOccupant && (
          <Checkbox
            label={`The ${selectedRole.name} is also the occupant of this unit`}
            labelStyle={controlLabelStyle}
            checked={isOccupant}
            onCheck={(evt, isChecked) => onOccupantToggled(isChecked)}
            disabled={disabled}
          />
        )}
      </div>
    )
  }
}

UnitRoleSelect.propTypes = {
  selectedRole: PropTypes.object,
  onRoleSelected: PropTypes.func.isRequired,
  isOccupant: PropTypes.bool,
  onOccupantToggled: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  showRequired: PropTypes.bool,
  availableRolesTypes: PropTypes.array
}

export default UnitRoleSelect
