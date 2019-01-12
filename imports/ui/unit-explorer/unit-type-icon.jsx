import React, { Component } from 'react'
import PropTypes from 'prop-types'
import FontIcon from 'material-ui/FontIcon'
import {
  unitIconsStyle
} from '../case-explorer/case-explorer.mui-styles'

const unitTypes = [
  { icon: 'home', categories: ['House', 'Apartment/Flat', 'Villa', 'Condominium', 'Apartment Block'] },
  { icon: 'store', categories: ['Shop', 'Salon'] },
  { icon: 'shopping_cart', categories: ['Shopping Mall'] },
  { icon: 'hotel', categories: ['hotel', 'Hotel', 'Hotel Room'] },
  { icon: 'business', categories: ['Office'] },
  { icon: 'location_city', categories: ['Warehouse'] },
  { icon: 'restaurant', categories: ['Restaurant/Cafe'] }
]

const iconDict = unitTypes.reduce((all, def) => {
  def.categories.forEach(cat => {
    all[cat] = def.icon
  })
  return all
}, {})

export default class UnitTypeIcon extends Component {
  render () {
    const { unitType } = this.props
    const iconName = unitType && unitType !== 'not_listed'
      ? iconDict[unitType]
      : 'not_listed_location'
    return (
      <FontIcon className='material-icons' color='var(--semi-dark-gray)' style={unitIconsStyle}>
        {iconName}
      </FontIcon>
    )
  }
}

UnitTypeIcon.propTypes = {
  unitType: PropTypes.string
}
