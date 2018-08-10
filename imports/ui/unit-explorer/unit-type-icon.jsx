import React, { Component } from 'react'
import PropTypes from 'prop-types'
import FontIcon from 'material-ui/FontIcon'

export default class UnitTypeIcon extends Component {
  render () {
    const { metaData } = this.props
    const unitTypes = [
      { icon: 'home', categories: ['House', 'Apartment/Flat', 'Villa', 'Condominium', 'Apartment Block'] },
      { icon: 'store', categories: ['Shop', 'Salon'] },
      { icon: 'shopping_cart', categories: ['Shopping Mall'] },
      { icon: 'hotel', categories: ['hotel', 'Hotel', 'Hotel Room'] },
      { icon: 'business', categories: ['Office'] },
      { icon: 'location_city', categories: ['Warehouse'] },
      { icon: 'restaurant', categories: ['Restaurant/Cafe'] }
    ]
    const icon = unitTypes.find(type => type.categories.includes(metaData.unitType))
    let unitTypeIcon
    if (metaData === null || metaData.unitType === null) {
      unitTypeIcon = <FontIcon className='material-icons' color='var(--semi-dark-gray)'>not_listed_location</FontIcon>
    } else if (icon && icon.icon) {
      unitTypeIcon = <FontIcon className='material-icons' color='var(--semi-dark-gray)'>{icon.icon}</FontIcon>
    }

    return (
      <div>
        {unitTypeIcon}
      </div>
    )
  }
}

UnitTypeIcon.propTypes = {
  metaData: PropTypes.object
}
