import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import PropTypes from 'prop-types'
import RootAppBar from '../components/root-app-bar'
import memoizeOne from 'memoize-one'
import Reports, { collectionName, REPORT_DRAFT_STATUS } from '../../api/reports'
import Preloader from '../preloader/preloader'
import { setDrawerState, storeBreadcrumb } from '../general-actions'
import { NoItemMsg } from '../explorer-components/no-item-msg'
import { FilterRow } from '../explorer-components/filter-row'
import { UnitGroupList } from '../explorer-components/unit-group-list'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import FontIcon from 'material-ui/FontIcon'
import { ReportList } from '../report-explorer/report-list'
import UnitSelectDialog from '../dialogs/unit-select-dialog'
import { push } from 'react-router-redux'

class ReportExplorer extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      filterStatus: true,
      myInvolvement: false,
      open: false
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

  handleOnItemClicked = () => {
    const { dispatch, match } = this.props
    dispatch(storeBreadcrumb(match.url))
  }

  handleOnUnitClicked = (unitId) => {
    const { dispatch } = this.props
    dispatch(push(`/unit/${unitId}/reports/new`))
  }

  makeReportGrouping = memoizeOne(
    (reportList, filterStatus, myInvolvement) => {
      const statusFilter = filterStatus
        ? report => report.status !== REPORT_DRAFT_STATUS
        : report => report.status === REPORT_DRAFT_STATUS
      const creatorFilter = myInvolvement ? x => x.assignee === this.props.currentUser.bugzillaCreds.login : x => true
      const unitDict = reportList.reduce((dict, reportItem) => {
        if (statusFilter(reportItem) && creatorFilter(reportItem)) {
          const { selectedUnit: unitBzName, unitMetaData: metaData } = reportItem
          const unitType = metaData ? metaData.unitType : 'not_listed'
          const bzId = metaData ? metaData.bzId : 'not_listed'
          const unitTitle = metaData && metaData.displayName ? metaData.displayName : unitBzName
          const unitDesc = dict[unitBzName] = dict[unitBzName] || {items: [], unitType, bzId, unitTitle}
          unitDesc.items.push(reportItem)
        }
        return dict
      }, {})

      return Object.values(unitDict)
    }
  )

  render () {
    const { isLoading, dispatch, reportList } = this.props
    const { filterStatus, myInvolvement, open } = this.state
    if (isLoading) return <Preloader />
    const reportGrouping = this.makeReportGrouping(reportList, filterStatus, myInvolvement)
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
              /> : (<NoItemMsg item={'report'} buttonOption />)
            }
          </div>
          <div className='absolute right-1 bottom-2'>
            <FloatingActionButton onClick={() => this.setState({open: true})}>
              <FontIcon className='material-icons'>add</FontIcon>
            </FloatingActionButton>
            <UnitSelectDialog
              show={open}
              onDismissed={() => this.setState({open: false})}
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
export default connect(
  () => ({}) // map redux state to props
)(createContainer(() => { // map meteor state to props
  const reportsHandle = Meteor.subscribe(`${collectionName}.associatedWithMe`, {
    onStop: (error) => {
      reportsError = error
    }
  })
  return {
    reportList: Reports.find().fetch().map(report => ({
      unitMetaData: report.unitMetaData(),
      ...report
    })),
    isLoading: !reportsHandle.ready(),
    currentUser: Meteor.subscribe('users.myBzLogin').ready() ? Meteor.user() : null,
    reportsError
  }
}, ReportExplorer))
