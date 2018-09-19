import React, { Component } from 'react'
import FilteredUnits from './filtered-units'
import PropTypes from 'prop-types'

export default class FilteredUnitsContainer extends Component {
  render () {
    const { filteredUnits, currentUserId, active, handleAddCaseClicked, handleUnitClicked, showAddBtn } = this.props
    const administratedUnits = filteredUnits.filter(unit => unit.metaData.ownerIds && unit.metaData.ownerIds.includes(currentUserId))
    const unitsInvolvedIn = filteredUnits.filter(unit => !unit.metaData.ownerIds || !unit.metaData.ownerIds.includes(currentUserId))

    return (
      <div className='flex flex-column'>
        {filteredUnits.length === 0 ? (
          <div className='f6 i silver ba b--moon-gray mt2 pa2 tc br1 mr3 ml3'>
            { active ? ('You have no units managed with Unee-T yet') : ('You have no disabled units') }
          </div>
        ) : <div>
          <FilteredUnits
            filteredUnits={administratedUnits}
            handleAddCaseClicked={handleAddCaseClicked}
            handleUnitClicked={handleUnitClicked}
            showAddBtn={showAddBtn}
            titleMode={1}
          />
          <FilteredUnits
            filteredUnits={unitsInvolvedIn}
            handleAddCaseClicked={handleAddCaseClicked}
            handleUnitClicked={handleUnitClicked}
            showAddBtn={showAddBtn}
            titleMode={2}
          />
        </div>
        }
      </div>
    )
  }
}

FilteredUnitsContainer.propTypes = {
  filteredUnits: PropTypes.array,
  currrentUserId: PropTypes.string,
  active: PropTypes.bool,
  handleUnitClicked: PropTypes.func,
  handleAddCaseClicked: PropTypes.func,
  showAddBtn: PropTypes.bool
}
