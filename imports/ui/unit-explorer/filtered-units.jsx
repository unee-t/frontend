import React, { Component } from 'react'
import PropTypes from 'prop-types'
import MenuItem from 'material-ui/MenuItem'
import UnitTypeIcon from './unit-type-icon'

import { resetMenuItemDivStyle } from '../general.mui-styles'

export default class FilteredUnits extends Component {
  render () {
    const { filteredUnits, showAddBtn, handleUnitClicked, handleAddCaseClicked } = this.props

    return (
      <div className='flex-grow flex flex-column overflow-auto'>
        {filteredUnits.map(({ id, name, description, metaData }) => (
          <MenuItem key={id} innerDivStyle={resetMenuItemDivStyle} onClick={() => handleUnitClicked(id)} >
            <div className='mt2 ph2 bb b--very-light-gray br1 w-100 flex items-center pa2'>
              <UnitTypeIcon unitType={metaData ? metaData.unitType : ''} />
              <div className='ml3 mv1 semi-dark-gray lh-copy flex-grow overflow-hidden'>
                <div className='ti1 ellipsis'>{(metaData && metaData.displayName) || name}</div>
                <div className='ti1 ellipsis silver'>{ (metaData && metaData.moreInfo) || description}&nbsp;</div>
              </div>
              { showAddBtn && (
                <div
                  onClick={(evt) => { evt.stopPropagation(); handleAddCaseClicked(id) }}
                  className='f6 ellipsis ml3 pl1 mv1 bondi-blue fw5 no-shrink'
                >
                  Add case
                </div>
              )}
            </div>
          </MenuItem>
        ))
        }
      </div>
    )
  }
}

FilteredUnits.propTypes = {
  filteredUnits: PropTypes.array.isRequired,
  handleUnitClicked: PropTypes.func,
  handleAddCaseClicked: PropTypes.func,
  showAddBtn: PropTypes.bool
}
