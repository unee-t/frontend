import React, { Component } from 'react'
import UnitsByRoles from './units-by-roles'
import PropTypes from 'prop-types'

export default class FilteredUnitsList extends Component {
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
          <UnitsByRoles
            unitsByRoles={administratedUnits}
            handleAddCaseClicked={handleAddCaseClicked}
            handleUnitClicked={handleUnitClicked}
            showAddBtn={showAddBtn}
            administrate
          />
          <UnitsByRoles
            unitsByRoles={unitsInvolvedIn}
            handleAddCaseClicked={handleAddCaseClicked}
            handleUnitClicked={handleUnitClicked}
            showAddBtn={showAddBtn}
          />
        </div>
        }
      </div>
    )
  }
}

FilteredUnitsList.propTypes = {
  filteredUnits: PropTypes.array,
  currrentUserId: PropTypes.string,
  active: PropTypes.bool,
  handleUnitClicked: PropTypes.func,
  handleAddCaseClicked: PropTypes.func,
  showAddBtn: PropTypes.bool
}
