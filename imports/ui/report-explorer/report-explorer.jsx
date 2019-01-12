import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import PropTypes from 'prop-types'
import RootAppBar from '../components/root-app-bar'
import memoizeOne from 'memoize-one'
import Reports, { collectionName, REPORT_DRAFT_STATUS } from '../../api/reports'
import Preloader from '../preloader/preloader'
import { setDrawerState } from '../general-actions'
import { NoItemMsg } from '../explorer-components/no-item-msg'
import { UnitGroupList } from '../explorer-components/unit-group-list'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import FontIcon from 'material-ui/FontIcon'
import { ReportList } from '../report-explorer/report-list'
import UnitSelectDialog from '../dialogs/unit-select-dialog'
import { push } from 'react-router-redux'
import { SORT_BY, sorters } from '../explorer-components/sort-items'
import { Sorter } from '../explorer-components/sorter'
import { StatusFilter } from '../explorer-components/status-filter'
import { RoleFilter } from '../explorer-components/role-filter'
import Units, { collectionName as unitCollName } from '../../api/units'

class ReportExplorer extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      open: false,
      selectedStatusFilter: null,
      selectedRoleFilter: null,
      sortBy: null
    }
  }

  handleStatusFilterClicked = (event, index, selectedStatusFilter) => {
    this.setState({
      selectedStatusFilter: selectedStatusFilter
    })
  }

  handleRoleFilterClicked = (event, index, selectedRoleFilter) => {
    this.setState({
      selectedRoleFilter: selectedRoleFilter
    })
  }

  handleSortClicked = (event, index, value) => {
    this.setState({
      sortBy: value
    })
  }

  handleOnUnitClicked = (unitId) => {
    const { dispatch } = this.props
    dispatch(push(`/unit/${unitId}/reports/new`))
  }

  makeReportGrouping = memoizeOne(
    (reportList, selectedStatusFilter, selectedRoleFilter, sortBy) => {
      switch (selectedStatusFilter) {
        case 'All':
          reportList = reportList.filter(report => true)
          break
        case 'Draft':
          reportList = reportList.filter(report => report.status === REPORT_DRAFT_STATUS)
          break
        case 'Finalized':
          reportList = reportList.filter(report => report.status !== REPORT_DRAFT_STATUS)
          break
      }
      const creatorFilter = selectedRoleFilter !== 'Created by me' ? report => true : report => report.assignee === this.props.currentUser.bugzillaCreds.login
      const unitDict = reportList.reduce((dict, reportItem) => {
        if (creatorFilter(reportItem)) {
          const { selectedUnit: unitBzName, unitMetaData: metaData, isActive } = reportItem
          const unitType = metaData ? metaData.unitType : 'not_listed'
          const bzId = metaData ? metaData.bzId : 'not_listed'
          const unitTitle = metaData && metaData.displayName ? metaData.displayName : unitBzName
          const unitDesc = dict[unitBzName] = dict[unitBzName] || { items: [], unitType, bzId, unitTitle, isActive }
          unitDesc.items.push(reportItem)
        }
        return dict
      }, {})

      const reportBundle = Object.keys(unitDict).reduce((all, unitTitle) => {
        const { items, ...attrs } = unitDict[unitTitle]

        // Sorting items within a unit by the order descending order of last update
        items.sort(sorters[sortBy])
        all.push({
          items: items,
          unitTitle,
          ...attrs
        })
        return all
      }, []) // Sorting by the latest case update for each
      const grouping = sortBy ? reportBundle.sort(sorters[sortBy]) : reportBundle.sort(sorters[SORT_BY.DATE_DESCENDING])
      return grouping
    }
  )

  render () {
    const { isLoading, dispatch, reportList } = this.props
    const { selectedStatusFilter, selectedRoleFilter, open, sortBy } = this.state
    if (isLoading) return <Preloader />
    const reportGrouping = this.makeReportGrouping(reportList, selectedStatusFilter, selectedRoleFilter, sortBy)

    return (
      <div className='flex flex-column flex-grow full-height'>
        <RootAppBar title='Inspection Reports' onIconClick={() => dispatch(setDrawerState(true))} shadowless />
        <div className='flex flex-column roboto overflow-hidden flex-grow h-100 relative'>
          <div className='flex bg-very-light-gray'>
            <StatusFilter
              selectedStatusFilter={selectedStatusFilter}
              onFilterClicked={this.handleStatusFilterClicked}
              status={['All', 'Draft', 'Finalized']}
            />
            <RoleFilter
              selectedRoleFilter={selectedRoleFilter}
              onRoleFilterClicked={this.handleRoleFilterClicked}
              roles={['All', 'Created by me']}
            />
            <Sorter
              onSortClicked={this.handleSortClicked}
              sortBy={sortBy}
            />
          </div>
          <div className='bb b--black-10 overflow-auto flex-grow flex flex-column bg-very-light-gray pb6'>
            { reportGrouping.length
              ? (
                <UnitGroupList
                  unitGroupList={reportGrouping}
                  creationUrlGenerator={bzId => `/unit/${bzId}/reports/new`}
                  expandedListRenderer={({ allItems }) => (
                    <ReportList
                      allReports={allItems}
                    />
                  )}
                  name={'report'}
                />
              ) : (<NoItemMsg item={'report'} iconType={'content_paste'} buttonOption />)
            }
          </div>
          <div className='absolute right-1 bottom-2'>
            <FloatingActionButton onClick={() => this.setState({ open: true })}>
              <FontIcon className='material-icons'>add</FontIcon>
            </FloatingActionButton>
            <UnitSelectDialog
              show={open}
              onDismissed={() => this.setState({ open: false })}
              onUnitClick={this.handleOnUnitClicked}
            />
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
  const unitsHandle = Meteor.subscribe(`${unitCollName}.forBrowsing`, {
    onStop: (error) => {
      unitsError = error
    }
  })
  return {
    reportList: Reports.find().fetch().map(report => ({
      isActive: (Units.findOne({ name: report.selectedUnit }) || {}).is_active,
      unitMetaData: report.unitMetaData(),
      ...report
    })),
    isLoading: !reportsHandle.ready() || !unitsHandle.ready(),
    currentUser: Meteor.subscribe('users.myBzLogin').ready() ? Meteor.user() : null,
    reportsError,
    unitsError
  }
}, ReportExplorer))
