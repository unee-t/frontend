import React, { Component } from 'react'
import UnitTypeIcon from '../unit-explorer/unit-type-icon'
import { ItemList } from '../explorer-components/item-list'
import { Link } from 'react-router-dom'
import { storeBreadcrumb } from '../general-actions'
import PropTypes from 'prop-types'

export class ItemRow extends Component {
  render () {
    const { unitTitle, expandedUnits, items, unitType, unitItems, bzId, handleExpandUnit, dispatch, match } = this.props
    const isExpanded = expandedUnits.includes(unitTitle)
    return (
      <div key={unitTitle}>
        <div className='flex items-center h3 bt b--light-gray bg-white'
          onClick={(evt) => handleExpandUnit(evt, unitTitle)}
        >
          <UnitTypeIcon iconInExplorer={unitType} />
          <div className='flex-grow ellipsis mid-gray mr4'>
            {unitTitle}
            <div className='flex justify-space'>
              <div className={'f6 silver mt1'}>
                {items.length} report{ items.length > 1 && 's'}
              </div>
              {(
                <div className='no-shrink flex items-center'>
                  <Link
                    className='f6 link ellipsis ml3 pl1 mv1 bondi-blue fw5'
                    to={`/unit/${bzId}/reports/new`}>
                    Add report
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        {isExpanded && (
          <ul className='list bg-light-gray ma0 pl0 shadow-in-top-1'>
            <ItemList
              allItems={unitItems}
              onItemClick={() => dispatch(storeBreadcrumb(match.url))}
              name='report'
            />
          </ul>
        )}
      </div>
    )
  }
}

ItemRow.propTypes = {
  unitTitle: PropTypes.string,
  expandedUnits: PropTypes.array,
  unitType: PropTypes.string,
  bzId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number]),
  myInvolvement: PropTypes.bool,
  items: PropTypes.array,
  unitItems: PropTypes.array,
  handleExpandUnit: PropTypes.func.isRequired
}
