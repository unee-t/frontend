import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  selectInputIconStyle,
  noUnderline,
  sortBoxInputStyle,
  selectedItemStyle
} from '../components/form-controls.mui-styles'
import MenuItem from 'material-ui/MenuItem'
import SelectField from 'material-ui/SelectField'
import { labels } from '../explorer-components/sort-items'

export class Sorter extends Component {
  handleSortClicked = (event, index, values) => {
    this.props.onSortClicked(event, index, values)
  }

  sortMenu (sortBy) {
    const categories = this.props.labels ? this.props.labels : labels
    return categories.map(([sortBy, label], index) => (
      <MenuItem
        key={index}
        value={sortBy}
        primaryText={label.category}
        label={label.selected}
      />
    ))
  }

  render () {
    const { sortBy } = this.props
    return (
      <SelectField
        hintText='Sort by'
        value={sortBy}
        onChange={this.handleSortClicked}
        underlineStyle={noUnderline}
        hintStyle={sortBoxInputStyle}
        iconStyle={selectInputIconStyle}
        labelStyle={sortBoxInputStyle}
        selectedMenuItemStyle={selectedItemStyle}
      >
        {this.sortMenu(sortBy)}
      </SelectField>
    )
  }
}

Sorter.propTypes = {
  labels: PropTypes.array,
  sortBy: PropTypes.number,
  categories: PropTypes.array,
  onSortClicked: PropTypes.func
}
