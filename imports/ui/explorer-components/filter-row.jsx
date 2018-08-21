import React, { Component } from 'react'
import PropTypes from 'prop-types'

export class FilterRow extends Component {
  render () {
    const { filterStatus, myInvolvement, handleMyInvolvementClicked, handleStatusClicked, filterLabels } = this.props
    return (
      <div className='flex pl3 pv3 bb b--very-light-gray bg-white'>
        <div
          onClick={() => handleStatusClicked(true)}
          className={'f6 fw5 ph2 ' + (filterStatus ? 'mid-gray' : 'silver')}
        >
          {filterLabels[0]}
        </div>
        <div
          onClick={() => handleStatusClicked(false)}
          className={'f6 fw5 ml4 ph2 ' + (!filterStatus ? 'mid-gray' : 'silver')}
        >
          {filterLabels[1]}
        </div>
        <div
          onClick={() => handleMyInvolvementClicked()}
          className={'f6 fw5 ml4 ph2 ' + (myInvolvement ? 'mid-gray' : 'silver')}
        >
          {filterLabels[2]}
        </div>
      </div>
    )
  }
}

FilterRow.propTypes = {
  filterStatus: PropTypes.bool,
  myInvolvement: PropTypes.bool,
  filterLabels: PropTypes.array,
  handleMyInvolvementClicked: PropTypes.func.isRequired,
  handleStatusClicked: PropTypes.func.isRequired
}
