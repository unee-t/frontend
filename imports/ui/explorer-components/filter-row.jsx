import React, { Component } from 'react'
import PropTypes from 'prop-types'

export class FilterRow extends Component {
  render () {
    const { filterStatus, myInvolvement, handleAssignedClicked, handleStatusClicked, filterType } = this.props
    return (
      <div className='flex pl3 pv3 bb b--very-light-gray bg-white'>
        <div
          onClick={() => handleStatusClicked(true)}
          className={'f6 fw5 ph2 ' + (filterStatus ? 'mid-gray' : 'silver')}
        >
          {filterType[0]}
        </div>
        <div
          onClick={() => handleStatusClicked(false)}
          className={'f6 fw5 ml4 ph2 ' + (!filterStatus ? 'mid-gray' : 'silver')}
        >
          {filterType[1]}
        </div>
        <div
          onClick={() => handleAssignedClicked()}
          className={'f6 fw5 ml4 ph2 ' + (myInvolvement ? 'mid-gray' : 'silver')}
        >
          {filterType[2]}
        </div>
      </div>
    )
  }
}

FilterRow.propTypes = {
  filterStatus: PropTypes.bool,
  myInvolvement: PropTypes.bool,
  filterType: PropTypes.array,
  handleAssignedClicked: PropTypes.func.isRequired,
  handleStatusClicked: PropTypes.func.isRequired
}
