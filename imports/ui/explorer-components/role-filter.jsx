import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  selectInputIconStyle,
  noUnderline,
  sortBoxInputStyle,
  selectedItemStyle,
  sortBoxBlueInputStyle
} from '../components/form-controls.mui-styles'
import MenuItem from 'material-ui/MenuItem'
import SelectField from 'material-ui/SelectField'

export class RoleFilter extends Component {
  handleRoleFilterClicked = (event, index, values) => {
    this.props.onRoleFilterClicked(event, index, values)
  }

  filterMenu (filterValues, menuItem, label) {
    return menuItem.map((name, index) => (
      <MenuItem
        key={name}
        value={name}
        primaryText={name}
        label={label}
      />
    ))
  }

  render () {
    const { selectedRoleFilter, roles } = this.props
    return (
      <SelectField
        hintText='My role'
        value={selectedRoleFilter}
        onChange={this.handleRoleFilterClicked}
        autoWidth
        underlineStyle={noUnderline}
        hintStyle={sortBoxInputStyle}
        iconStyle={selectInputIconStyle}
        labelStyle={selectedRoleFilter === 'All' ? sortBoxInputStyle : sortBoxBlueInputStyle}
        selectedMenuItemStyle={selectedItemStyle}
      >
        {this.filterMenu(selectedRoleFilter, roles, 'Role Filter')}
      </SelectField>
    )
  }
}

RoleFilter.propTypes = {
  roles: PropTypes.array,
  selectedRoleFilter: PropTypes.string,
  onRoleFilterClicked: PropTypes.func
}
