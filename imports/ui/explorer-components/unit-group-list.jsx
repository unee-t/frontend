import React, { Component } from 'react'
import UnitTypeIcon from '../unit-explorer/unit-type-icon'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'

export function AddGroupLink ({ name, bzId }) {
  let link
  name === 'case' ? link = `/case/new?unit=${bzId}` : link = `/unit/${bzId}/reports/new`
  return (
    <div className='no-shrink flex items-center'>
      {bzId &&
      <Link
        className='f6 link ellipsis ml3 pl1 mv1 bondi-blue fw5'
        to={link}>
        Add {name}
      </Link>
      }
    </div>
  )
}

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
    const { unitGroupList, name, expandedListRenderer } = this.props
    const { expandedUnits } = this.state
    const isExpanded = (unitTitle) => expandedUnits.includes(unitTitle)
    return (
      <div>
        {unitGroupList.map(({ unitTitle, unitType, bzId, items, hasUnread }) =>
          <div key={unitTitle}>
            <div className='flex items-center h3 bt b--light-gray bg-white'
              onClick={evt => this.handleExpandUnit(evt, unitTitle)}
            >
              <div className='mh3'>
                <UnitTypeIcon iconInExplorer={unitType} />
              </div>
              <div className='flex-grow ellipsis mid-gray mr4'>
                {unitTitle}
                <div className='flex justify-space'>
                  <div className={'f6 silver mt1' + (hasUnread ? ' b' : '')}>
                    <span>{items.length} { items.length > 1 ? name + 's' : name }</span>
                  </div>
                  <AddGroupLink bzId={bzId} name={name} />
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
  expandedListRenderer: PropTypes.func.isRequired
}
