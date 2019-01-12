import React, { Component } from 'react'
import UnitTypeIcon from '../unit-explorer/unit-type-icon'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'

export class UnitGroupList extends Component {
  constructor (props) {
    super(props)
    this.state = {
      expandedUnits: []
    }
  }

  handleExpandUnit (evt, unitTitle) {
    evt.preventDefault()
    const { expandedUnits } = this.state
    let stateMutation
    if (expandedUnits.includes(unitTitle)) {
      stateMutation = {
        expandedUnits: expandedUnits.filter(title => title !== unitTitle)
      }
    } else {
      stateMutation = {
        expandedUnits: expandedUnits.concat([unitTitle])
      }
    }
    this.setState(stateMutation)
  }

  render () {
    const { unitGroupList, name, expandedListRenderer, creationUrlGenerator } = this.props
    const { expandedUnits } = this.state
    const isExpanded = (unitTitle) => expandedUnits.includes(unitTitle)
    return (
      <div>
        {unitGroupList.map(({ unitTitle, unitType, bzId, items, hasUnread, isActive }) =>
          <div key={unitTitle}>
            <div className='flex items-center h3 bt b--light-gray bg-white'
              onClick={evt => this.handleExpandUnit(evt, unitTitle)}
            >
              <div className='mh3'>
                <UnitTypeIcon unitType={unitType} />
              </div>
              <div className='flex-grow ellipsis mid-gray mr4'>
                {unitTitle}
                <div className='flex justify-space'>
                  <div className={'f6 silver mt1' + (hasUnread ? ' b' : '')}>
                    <span>{items.length} { items.length > 1 ? name + 's' : name }</span>
                  </div>
                  {!isActive ? (
                    <div className='no-shrink flex items-center br2 bg-silver'>
                      <div className='f7 pa1 white'>Unit Disabled</div>
                    </div>
                  )
                    : bzId && (
                      <div className='no-shrink flex items-center'>
                        <Link
                          className='f6 link ellipsis ml3 pl1 mv1 bondi-blue fw5'
                          to={creationUrlGenerator(bzId)}>
                          Add {name}
                        </Link>
                      </div>
                    )
                  }
                </div>
              </div>
            </div>
            {isExpanded(unitTitle) && (
              <ul className='list bg-light-gray ma0 pl0 shadow-in-top-1'>
                {expandedListRenderer({
                  allItems: items
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    )
  }
}

UnitGroupList.propTypes = {
  unitGroupList: PropTypes.array,
  name: PropTypes.string,
  expandedListRenderer: PropTypes.func.isRequired,
  creationUrlGenerator: PropTypes.func.isRequired
}
