import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Meteor } from 'meteor/meteor'
import { createContainer } from 'meteor/react-meteor-data'
import { push, goBack } from 'react-router-redux'
import { Route, Link } from 'react-router-dom'
import { Tabs, Tab } from 'material-ui/Tabs'
import SwipeableViews from 'react-swipeable-views'
import MenuItem from 'material-ui/MenuItem'
import FontIcon from 'material-ui/FontIcon'
import IconButton from 'material-ui/IconButton'
import { CSSTransition } from 'react-transition-group'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import moment from 'moment'
import Units, { collectionName as unitsCollName, getUnitRoles } from '../../api/units'
import Cases, { isClosed, severityIndex, collectionName as casesCollName } from '../../api/cases'
import Reports, { collectionName as reportsCollName, REPORT_DRAFT_STATUS } from '../../api/reports'
import { placeholderEmailMatcher } from '../../util/matchers'
import InnerAppBar from '../components/inner-app-bar'
import ConfirmationDialog from '../dialogs/confirmation-dialog'
import CreateReportDialog from '../dialogs/create-report-dialog'
import { makeMatchingUser } from '../../api/custom-users'
import Preloader from '../preloader/preloader'
import { infoItemMembers } from '../util/static-info-rendering'
import { userInfoItem } from '../../util/user'
import CaseMenuItem from '../components/case-menu-item'
import { ReportIcon } from '../report/report-icon'
import { SORT_BY, sorters, labels } from '../explorer-components/sort-items'
import { Sorter } from '../explorer-components/sorter'
import { StatusFilter } from '../explorer-components/status-filter'
import { RoleFilter } from '../explorer-components/role-filter'
import { removeFromUnit, removeCleared } from '/imports/state/actions/unit-invite.actions'

import {
  menuItemDivStyle
} from '../general.mui-styles'
import CircularProgress from 'material-ui/CircularProgress'
import ErrorDialog from '../dialogs/error-dialog'

function NoItem ({ item, iconType }) {
  return (
    <div className='mt5 pt3 tc'>
      <div className='dib relative'>
        <FontIcon className='material-icons' color='var(--moon-gray)' style={{ fontSize: '5rem' }}>
          {iconType}
        </FontIcon>
        <div className='absolute bottom-0 right-0 pb1'>
          <div className='br-100 ba b--very-light-gray bg-very-light-gray lh-cram'>
            <FontIcon className='material-icons' color='var(--moon-gray)' style={{ fontSize: '2.5rem' }}>
              add_circle_outline
            </FontIcon>
          </div>
        </div>
      </div>
      <div className='mid-gray b lh-copy'>
        You have no {item}s yet
      </div>
    </div>
  )
}

const viewsOrder = ['cases', 'reports', 'overview']

class Unit extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      sortedCases: [],
      selectedStatusFilter: null,
      selectedRoleFilter: null,
      sortBy: null,
      userToRemove: null,
      showRemovalConfirmation: false
    }
  }

  get filteredCases () {
    const { sortedCases, selectedStatusFilter, selectedRoleFilter, sortBy } = this.state
    let statusFilter
    switch (selectedStatusFilter) {
      case 'Open':
        statusFilter = caseItem => !isClosed(caseItem)
        break
      case 'Closed':
        statusFilter = caseItem => isClosed(caseItem)
        break
      case 'All':
      default:
        statusFilter = caseItem => true
    }
    const assignedFilter = selectedRoleFilter === 'Created By Me' ? x => x.assignee === this.props.currentUser.bugzillaCreds.login : x => true
    const filteredCases = sortedCases.filter(caseItem => assignedFilter(caseItem) && statusFilter(caseItem)).sort(sorters[sortBy])
    return filteredCases
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

  handleChange = val => {
    const { match, dispatch } = this.props
    dispatch(push(`${match.url}/${viewsOrder[val]}`))
  }

  handleRemovalClearRequested = () => {
    const ongoingRemoval = this.getOngoingRemoval(this.props, this.state)
    this.props.dispatch(removeCleared(ongoingRemoval.userEmail, ongoingRemoval.unitBzId))
  }

  componentWillReceiveProps (nextProps, nextState) {
    const { caseList } = this.props
    if ((!caseList && nextProps.caseList) || (caseList && caseList.length !== nextProps.caseList.length)) {
      this.setState({
        sortedCases: nextProps.caseList.slice().sort((a, b) =>
          severityIndex.indexOf(a.severity) - severityIndex.indexOf(b.severity)
        )
      })
    }
    const prevOngoingRemoval = this.getOngoingRemoval(this.props, this.state)
    const nextOngoingRemoval = this.getOngoingRemoval(nextProps, nextState)
    if (prevOngoingRemoval && nextOngoingRemoval && nextOngoingRemoval.complete) {
      this.handleRemovalClearRequested()
    }
  }

  filteredReports () {
    const { reportList, currentUser } = this.props
    const { selectedStatusFilter, selectedRoleFilter, sortBy } = this.state
    switch (selectedStatusFilter) {
      case 'All':
        reportList.filter(report => true)
        break
      case 'Draft':
        reportList.filter(report => report.status === REPORT_DRAFT_STATUS)
        break
      case 'Finalized':
        reportList.filter(report => report.status !== REPORT_DRAFT_STATUS)
        break
    }
    const creatorFilter = selectedRoleFilter === 'Created By Me' ? report => report.assignee === currentUser.bugzillaCreds.login : report => true
    const filteredReports = reportList.filter(reportItem => creatorFilter(reportItem))
      .sort(sorters[sortBy])
    return filteredReports.map(({ id, title, status, creation_time: date }) => {
      const isFinalized = status !== REPORT_DRAFT_STATUS
      const viewMode = isFinalized ? 'preview' : 'draft'
      return (
        <div key={id} className='relative bb b--very-light-gray bg-white flex items-center'>
          <Link to={`/report/${id}/${viewMode}`} className='link flex-grow relative w-100'>
            <MenuItem innerDivStyle={menuItemDivStyle}>
              <div className='pv2 flex-grow flex items-center w-100'>
                <ReportIcon isFinalized={isFinalized} />
                <div className='ml3 lh-copy pv1 flex-grow overflow-hidden'>
                  <div className='mid-gray ellipsis'>{title}</div>
                  <div className='silver mt1 f7 ellipsis'>
                    Created on {moment(date).format('YYYY-MM-DD')}
                  </div>
                </div>
              </div>
            </MenuItem>
          </Link>
        </div>
      )
    })
  }

  getOngoingRemoval (props, state) {
    const { userToRemove } = state
    const { unitItem, removalProcesses } = props

    return userToRemove ? removalProcesses.find(p => p.userEmail === userToRemove.email && p.unitBzId === unitItem.id) : null
  }

  render () {
    const {
      unitItem, isLoading, unitError, casesError, unitUsers, caseList, reportList, reportsError, dispatch, match, currentUser
    } = this.props
    const {
      sortedCases, selectedStatusFilter, selectedRoleFilter, sortBy, userToRemove, showRemovalConfirmation
    } = this.state
    const { filteredCases } = this
    const rootMatch = match
    const { unitId } = match.params

    if (isLoading) return <Preloader />
    if (unitError) return <h1>An error occurred: {unitError.error}</h1>
    if (casesError) return <h1>An error occurred: {casesError.error}</h1>
    if (reportsError) return <h1>An error occurred: {reportsError.error}</h1>

    const fabDescriptors = [
      {
        color: 'var(--bondi-blue)',
        href: `/case/new?unit=${unitId}`,
        icon: 'add'
      },
      {
        color: 'var(--bondi-blue)',
        href: `${rootMatch.url}/${viewsOrder[1]}/new`,
        icon: 'add'
      }
    ]
    const ongoingRemoval = this.getOngoingRemoval(this.props, this.state)
    const currLoginName = currentUser.bugzillaCreds.login

    const metaData = unitItem.metaData() || {}
    const unitName = metaData.displayName || unitItem.name

    const isOwner = metaData.ownerIds && metaData.ownerIds.includes(currentUser._id)
    return (
      <div className='full-height flex flex-column'>
        <InnerAppBar
          shadowless
          title={unitName}
          onBack={() => dispatch(push(match.url.split('/').slice(0, -1).join('/')))}
        />
        <Route path={`${rootMatch.url}/:viewName`} children={({ match }) => {
          const viewIdx = match ? viewsOrder.indexOf(match.params.viewName) : 0
          return (
            <div className='flex-grow flex flex-column overflow-hidden'>
              <Tabs
                className='no-shrink'
                onChange={this.handleChange}
                value={viewIdx}
                inkBarStyle={{ backgroundColor: 'white' }}
              >
                <Tab label={`CASES (${sortedCases.length})`} value={0} />
                <Tab label={`REPORTS (${reportList.length})`} value={1} />
                <Tab label='OVERVIEW' value={2} />
              </Tabs>
              <div className='flex-grow flex flex-column overflow-auto'>
                <SwipeableViews
                  resistance
                  style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                  containerStyle={{ flex: 1 }}
                  slideStyle={{ display: 'flex', flexDirection: 'column' }}
                  index={viewIdx}
                  onChangeIndex={this.handleChange}
                >

                  <div className='flex-grow bg-very-light-gray'>
                    { caseList.length ? (
                      <div>
                        <div className='flex bg-very-light-gray'>
                          <StatusFilter
                            selectedStatusFilter={selectedStatusFilter}
                            onFilterClicked={this.handleStatusFilterClicked}
                            status={['All', 'Open', 'Closed']}
                          />
                          <RoleFilter
                            selectedRoleFilter={selectedRoleFilter}
                            onRoleFilterClicked={this.handleRoleFilterClicked}
                            roles={['All', 'Assigned to me']}
                          />
                          <Sorter
                            onSortClicked={this.handleSortClicked}
                            sortBy={sortBy}
                            labels={labels.concat([
                              [SORT_BY.LATEST_UPDATE, { category: 'Updated - Latest', selected: 'Updated ↓' }],
                              [SORT_BY.OLDEST_UPDATE, { category: 'Updated - Oldest', selected: 'Updated ↑' }]
                            ])}
                          />
                        </div>
                        { filteredCases.map(caseItem => (
                          <CaseMenuItem
                            key={caseItem.id}
                            className='ph3'
                            caseItem={caseItem}
                            onClick={() => {
                              dispatch(push(`/case/${caseItem.id}`))
                            }}
                          />
                        ))
                        }
                      </div>
                    ) : (<NoItem item='case' iconType='card_travel' />) }
                  </div>
                  <div className='flex-grow bg-very-light-gray'>
                    {reportList.length ? (
                      <div>
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
                        {this.filteredReports()}
                      </div>
                    ) : (
                      <NoItem item='inspection report' iconType='content_paste' />
                    )}
                    <Route exact path={`${rootMatch.url}/${viewsOrder[1]}/new`} children={({ match }) => (
                      <CreateReportDialog
                        show={!!match}
                        onDismissed={() => dispatch(goBack())}
                        unitName={unitItem.name}
                      />
                    )} />
                  </div>
                  <div className='flex-grow bg-very-light-gray'>
                    <div className='bg-white card-shadow-1 pa3'>
                      <div>
                        {infoItemMembers('Unit name', unitName)}
                      </div>
                      <div className='mt3'>
                        {infoItemMembers('Unit group', unitItem.classification)}
                      </div>
                      <div className='mt3'>
                        {infoItemMembers('Unit type', metaData.unitType)}
                      </div>
                      <div className='mt3'>
                        {infoItemMembers('Additional description', metaData.moreInfo || unitItem.description)}
                      </div>
                    </div>
                    <div className='mt2 bg-white card-shadow-1 pa3'>
                      <div className='fw5 silver lh-title'>
                        ADDRESS
                      </div>
                      <div className='mt1'>
                        {infoItemMembers('Address', metaData.streetAddress)}
                      </div>
                      <div className='mt3'>
                        {infoItemMembers('City', metaData.city)}
                      </div>
                      <div className='mt3'>
                        {infoItemMembers('Country', metaData.country)}
                      </div>
                      <div className='mt3 flex'>
                        <div className='flex-grow'>
                          {infoItemMembers('State', metaData.state)}
                        </div>
                        <div className='flex-grow'>
                          {infoItemMembers('Zip / Postal code', metaData.zipCode)}
                        </div>
                      </div>
                    </div>
                    <div className='mt2 bg-white card-shadow-1 pa3'>
                      <div className='fw5 silver lh-title'>
                        PEOPLE
                      </div>
                      {ongoingRemoval && ongoingRemoval.pending ? (
                        <div className='flex items-center justify-center pv4'>
                          <CircularProgress size={70} thickness={5} />
                        </div>
                      ) : unitUsers
                        .filter(user => !placeholderEmailMatcher(user.login))
                        .sort((a, b) => a._id === currentUser._id // Sorting for the curr user to appear first
                          ? 1
                          : b._id === currentUser._id
                            ? -1
                            : 0
                        )
                        .map(user => (
                          <div className='mt1' key={user.login}>
                            {userInfoItem(user, isOwner && currLoginName !== user.login && (user => !!user.email && (
                              <IconButton onClick={() => this.setState({
                                userToRemove: user,
                                showRemovalConfirmation: true
                              })}>
                                <FontIcon className='material-icons' color='#999'>close</FontIcon>
                              </IconButton>
                            )))}
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </SwipeableViews>
              </div>

              {fabDescriptors.map((desc, ind) => (
                <div key={ind} className='absolute bottom-1 right-1'>
                  <CSSTransition in={viewIdx === ind} timeout={500} classNames='zoom-effect' unmountOnExit>
                    <FloatingActionButton
                      backgroundColor={desc.color}
                      className='zoom-effect'
                      onClick={() => dispatch(push(desc.href))}
                    >
                      <FontIcon className='material-icons'>{desc.icon}</FontIcon>
                    </FloatingActionButton>
                  </CSSTransition>
                </div>
              ))}
            </div>
          )
        }} />
        <ConfirmationDialog
          show={!!showRemovalConfirmation}
          onConfirm={() => {
            this.setState({ showRemovalConfirmation: false })
            dispatch(removeFromUnit(userToRemove.email, unitItem.id))
          }}
          onCancel={() => this.setState({ userToRemove: null, showRemovalConfirmation: false })}
          confirmLabel='Remove User'
          title={userToRemove ? (
            <div>
              <div className='tc fw3'>
                Are you sure you want to remove
                <span className='bondi-blue'> {userToRemove.name || userToRemove.login.split('@')[0]} </span>
                from the unit
                <span className='b'> {unitName}</span>
                ?
              </div>
            </div>
          ) : ''}
        >
          <div className='tc lh-copy'>
            This person will not be able to create new cases, post any comments or receive any notifications for this unit.
          </div>
        </ConfirmationDialog>
        <ErrorDialog
          show={!!(ongoingRemoval && ongoingRemoval.error)}
          text={ongoingRemoval && ongoingRemoval.error ? ongoingRemoval.error.message : 'Error'}
          onDismissed={this.handleRemovalClearRequested}
        />
      </div>
    )
  }
}
Unit.propTypes = {
  unitItem: PropTypes.object,
  unitError: PropTypes.object,
  casesError: PropTypes.object,
  reportsError: PropTypes.object,
  isLoading: PropTypes.bool,
  unitUsers: PropTypes.array,
  caseList: PropTypes.array,
  reportList: PropTypes.array,
  removalProcesses: PropTypes.array.isRequired
}

let unitError, casesError, reportsError
export default connect(
  ({ unitUserRemovalState }) => ({ removalProcesses: unitUserRemovalState })
)(createContainer((props) => {
  const { unitId } = props.match.params
  const unitHandle = Meteor.subscribe(`${unitsCollName}.byIdWithUsers`, unitId, {
    onStop: error => {
      unitError = error
    }
  })
  const handles = [
    unitHandle,
    Meteor.subscribe('users.myBzLogin')
  ]
  const unitItem = Units.findOne({ id: parseInt(unitId) })
  if (unitItem) {
    handles.push(
      Meteor.subscribe(`${casesCollName}.byUnitName`, unitItem.name, {
        onStop: error => {
          casesError = error
        }
      }),
      Meteor.subscribe(`${reportsCollName}.byUnitName`, unitItem.name, {
        onStop: error => {
          reportsError = error
        }
      })
    )
  }

  return {
    isLoading: handles.some(h => !h.ready()),
    unitUsers: unitHandle.ready() ? getUnitRoles(unitItem, Meteor.userId()).map(makeMatchingUser) : null,
    caseList: unitHandle.ready() ? Cases.find({ selectedUnit: unitItem.name }).fetch() : null,
    reportList: unitHandle.ready() ? Reports.find({ selectedUnit: unitItem.name }).fetch() : null,
    currentUser: Meteor.user(),
    reportsError,
    casesError,
    unitError,
    unitItem
  }
}, Unit))
