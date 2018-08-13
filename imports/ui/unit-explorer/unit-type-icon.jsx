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

export default class UnitTypeIcon extends Component {
  render () {
    const { metaData, iconInCaseExplorer } = this.props
    const iconType = (metaData && metaData.unitType) || iconInCaseExplorer
    const icon = unitTypes.find(type => type.categories.includes(iconType))
    let unitTypeIcon
    if (metaData === null || (metaData && metaData.unitType === null)) {
      unitTypeIcon =
        <FontIcon className='material-icons' color='var(--semi-dark-gray)'>
        not_listed_location
        </FontIcon>
    } else if (
      (iconInCaseExplorer === null || iconInCaseExplorer === undefined) &&
      metaData === undefined) {
      unitTypeIcon =
        <FontIcon className={'material-icons mh3'}
          color='var(--semi-dark-gray)'
          style={unitIconsStyle}
        >
        not_listed_location
        </FontIcon>
    } else if (icon && icon.icon) {
      unitTypeIcon =
        <FontIcon
          className={'material-icons ' + (iconInCaseExplorer ? 'mh3 ' : '')}
          color='var(--semi-dark-gray)'
          style={unitIconsStyle}
        >
          {icon.icon}
        </FontIcon>
    }
    return (unitTypeIcon)
  }
}

UnitTypeIcon.propTypes = {
  metaData: PropTypes.object,
  iconInCaseExplorer: PropTypes.string
}
