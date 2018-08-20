import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import PropTypes from 'prop-types'
import RootAppBar from '../components/root-app-bar'
import memoizeOne from 'memoize-one'
import Reports, { collectionName } from '../../api/reports'
import Preloader from '../preloader/preloader'
import { setDrawerState } from '../general-actions'
import Units, { collectionName as unitsCollName } from '../../api/units'
import { NoItemMsg } from '../explorer-components/no-item-msg'
import { FilterRow } from '../explorer-components/filter-row'
import { UnitGroupList } from '../explorer-components/unit-group-list'
import { UnitBtn } from '../explorer-components/unit-btn'

class ReportExplorer extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      filterStatus: true,
      myInvolvement: false,
      expandedUnits: []
    }
  }

  handleStatusClicked = (value) => {
    this.setState({ filterStatus: value })
  }

  handleAssignedClicked = () => {
    this.setState({ myInvolvement: !this.state.myInvolvement })
  }

  handleExpandUnit = (evt, unitTitle) => {
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

  makeReportGrouping = memoizeOne(
    (reportList, filterStatus, myInvolvement) => {
      const statusFilter = filterStatus ? report => report.status === 'CONFIRMED' : report => report.status === 'UNCONFIRMED'
      const creatorFilter = myInvolvement ? x => x.assignee === this.props.currentUser.bugzillaCreds.login : x => true
      var unitDict = reportList.reduce((dict, reportItem) => {
        if (statusFilter(reportItem) && creatorFilter(reportItem)) {
          const { selectedUnit: unitTitle, unitList } = reportItem
          const metaData = (unitList === undefined || unitList[0] === undefined) ? 'not_listed' : unitList[0].metaData
          const unitType = metaData === undefined ? 'not_listed' : metaData.unitType
          const bzId = metaData === undefined ? 'not_listed' : metaData.bzId
          const unitDesc = dict[unitTitle] = dict[unitTitle] || {reports: [], unitType, bzId}
          unitDesc.reports.push(reportItem)
        }
        return dict
      }, {})

      return Object.keys(unitDict).reduce((all, unitTitle) => {
        const { reports, unitType, bzId } = unitDict[unitTitle]
        all.push({
          unitTitle,
          unitType,
          bzId,
          reports
        })
        return all
      }, [])
    }
  )

  render () {
    const { isLoading, dispatch, reportList } = this.props
    const { filterStatus, myInvolvement, expandedUnits } = this.state
    const reportGrouping = this.makeReportGrouping(reportList, filterStatus, myInvolvement)
    if (isLoading) return <Preloader />
    return (
      <div className='flex flex-column flex-grow full-height'>
        <RootAppBar title='My Reports' onIconClick={() => dispatch(setDrawerState(true))} shadowless />
        <div className='flex flex-column roboto overflow-hidden flex-grow h-100 relative'>
          <div className='bb b--black-10 overflow-auto flex-grow flex flex-column bg-very-light-gray'>
            <FilterRow
              filterStatus={filterStatus}
              myInvolvement={myInvolvement}
              handleAssignedClicked={this.handleAssignedClicked}
              handleStatusClicked={this.handleStatusClicked}
              filterType={['Finalized', 'Draft', 'Created By Me']}
            />
            { reportGrouping.length
              ? <UnitGroupList
                unitGroupList={reportGrouping}
                handleExpandUnit={this.handleExpandUnit}
                expandedUnits={expandedUnits}
                name={'report'}
              /> : (<NoItemMsg item={'report'} />)
            }
          </div>
          <UnitBtn dispatch={dispatch} />
        </div>
      </div>
    )
  }
}

ReportExplorer.propTypes = {
  reportList: PropTypes.array
}

let reportsError
let unitsError
export default connect(
  () => ({}) // map redux state to props
)(createContainer(() => { // map meteor state to props
  const reportsHandle = Meteor.subscribe(`${collectionName}.associatedWithMe`, {
    onStop: (error) => {
      reportsError = error
    }
  })
  return {
    reportList: Reports.find().fetch().map(reportItem => Object.assign({}, reportItem, {
      unitHandle: Meteor.subscribe(`${unitsCollName}.byNameWithRoles`, reportItem.selectedUnit),
      unitList: Units.find({name: reportItem.selectedUnit}).fetch().map(unit => Object.assign({}, unit, {
        metaData: unit.metaData()
      }))
    })),
    isLoading: !reportsHandle.ready(),
    units: Units.find().fetch().map(unit => Object.assign({}, unit, {
      metaData: unit.metaData()
    })),
    currentUser: Meteor.subscribe('users.myBzLogin').ready() ? Meteor.user() : null,
    reportsError,
    unitsError
  }
}, ReportExplorer))
