import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import PropTypes from 'prop-types'
import RootAppBar from '../components/root-app-bar'
import memoizeOne from 'memoize-one'
import Reports, { collectionName } from '../../api/reports'
import Preloader from '../preloader/preloader'
import { setDrawerState, storeBreadcrumb } from '../general-actions'
import Units, { collectionName as unitsCollName } from '../../api/units'
import { NoItemMsg } from '../explorer-components/no-item-msg'
import { FilterRow } from '../explorer-components/filter-row'
import { UnitGroupList } from '../explorer-components/unit-group-list'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import FontIcon from 'material-ui/FontIcon'
import { push } from 'react-router-redux'
import { ReportList } from '../report-explorer/report-list'

class ReportExplorer extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      filterStatus: true,
      myInvolvement: false
    }
  }

  handleStatusClicked = (value) => {
    this.setState({ filterStatus: value })
  }

  handleMyInvolvementClicked = () => {
    this.setState({ myInvolvement: !this.state.myInvolvement })
  }

  handleOnItemClicked = () => {
    const { dispatch, match } = this.props
    dispatch(storeBreadcrumb(match.url))
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
    const { filterStatus, myInvolvement } = this.state
    const reportGrouping = this.makeReportGrouping(reportList, filterStatus, myInvolvement)
    if (isLoading) return <Preloader />
    return (
      <div className='flex flex-column flex-grow full-height'>
        <RootAppBar title='My Reports' onIconClick={() => dispatch(setDrawerState(true))} shadowless />
        <div className='flex flex-column roboto overflow-hidden flex-grow h-100 relative'>
          <div className='bb b--black-10 overflow-auto flex-grow flex flex-column bg-very-light-gray pb6'>
            <FilterRow
              filterStatus={filterStatus}
              myInvolvement={myInvolvement}
              handleMyInvolvementClicked={this.handleMyInvolvementClicked}
              handleStatusClicked={this.handleStatusClicked}
              filterLabels={['Finalized', 'Draft', 'Created By Me']}
            />
            { reportGrouping.length
              ? <UnitGroupList
                unitGroupList={reportGrouping}
                expandedListRenderer={({allItems}) => (
                  <ReportList
                    allReports={allItems}
                    onItemClick={this.handleOnItemClicked}
                  />)
                }
                name={'report'}
              /> : (<NoItemMsg item={'report'} />)
            }
          </div>
          <div className='absolute right-1 bottom-2'>
            <FloatingActionButton onClick={() => dispatch(push('/unit'))}>
              <FontIcon className='material-icons'>add</FontIcon>
            </FloatingActionButton>
          </div>
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
