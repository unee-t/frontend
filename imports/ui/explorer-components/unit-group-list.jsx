import React, { Component } from 'react'
import UnitTypeIcon from '../unit-explorer/unit-type-icon'
import { CaseList } from '../case-explorer/case-list'
import { ReportList } from '../report-explorer/report-list'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'

export function AddGroupLink ({name, bzId}) {
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
  render () {
    const { unitGroupList, handleExpandUnit, expandedUnits, handleOnItemClicked, name } = this.props
    const isExpanded = (unitTitle) => expandedUnits.includes(unitTitle)

    return (
      <div>
        {unitGroupList.map(({ unitTitle, unitType, bzId, reports: unitReports, cases: unitCases, hasUnread }) =>
          <div key={unitTitle}>
            <div className='flex items-center h3 bt b--light-gray bg-white'
              onClick={(evt) => handleExpandUnit(evt, unitTitle)}
            >
              <UnitTypeIcon iconInExplorer={unitType} />
              <div className='flex-grow ellipsis mid-gray mr4'>
                {unitTitle}
                <div className='flex justify-space'>
                  <div className={'f6 silver mt1' + (hasUnread ? ' b' : '')}>
                    {unitReports
                      ? (<span>{unitReports.length} report{ unitReports.length > 1 && 's'}</span>)
                      : (<span>{unitCases.length} case{ unitCases.length > 1 && 's'}</span>)
                    }
                  </div>
                  <AddGroupLink bzId={bzId} name={name} />
                </div>
              </div>
            </div>
            {isExpanded(unitTitle) && (
              <ul className='list bg-light-gray ma0 pl0 shadow-in-top-1'>
                { name === 'case'
                  ? (<CaseList
                    allCases={unitCases}
                    onItemClick={() => handleOnItemClicked()}
                  />
                  ) : (<ReportList
                    allReports={unitReports}
                    onItemClick={() => handleOnItemClicked()}
                  />)
                }
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
  expandedUnits: PropTypes.array,
  name: PropTypes.string,
  handleExpandUnit: PropTypes.func.isRequired,
  handleOnItemClicked: PropTypes.func.isRequired
}
