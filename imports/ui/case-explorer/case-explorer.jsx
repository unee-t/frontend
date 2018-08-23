import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import PropTypes from 'prop-types'
import UnverifiedWarning from '../components/unverified-warning.jsx'
import { withRouter } from 'react-router-dom'
import { push } from 'react-router-redux'
import FontIcon from 'material-ui/FontIcon'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import memoizeOne from 'memoize-one'
import Cases, { collectionName, isClosed } from '../../api/cases'
import CaseNotifications, { collectionName as notifCollName } from '../../api/case-notifications'
import UnitMetaData from '../../api/unit-meta-data'
import RootAppBar from '../components/root-app-bar'
import Preloader from '../preloader/preloader'
import { NoItemMsg } from '../explorer-components/no-item-msg'
import { FilterRow } from '../explorer-components/filter-row'
import { UnitGroupList } from '../explorer-components/unit-group-list'
import { storeBreadcrumb } from '../general-actions'
import { CaseList } from '../case-explorer/case-list'

class CaseExplorer extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      caseId: '',
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

  componentWillReceiveProps ({isLoading, casesError, caseList}) {
    if (!isLoading && !casesError && isLoading !== this.props.isLoading) {
      this.props.dispatchLoadingResult({caseList})
    }
  }
  makeCaseUpdateTimeDict = memoizeOne(
    allNotifications => allNotifications.reduce((dict, curr) => {
      const caseIdStr = curr.caseId.toString()
      const prevTime = dict[caseIdStr] ? dict[caseIdStr] : 0 // if dict[curr.caseId] === 0 it'll be set to 0, so no harm
      const currTime = curr.createdAt.getTime()
      dict[caseIdStr] = prevTime < currTime ? currTime : prevTime
      return dict
    }, {}),
    (a, b) => a.length === b.length
  )
  makeCaseUnreadDict = memoizeOne(
    unreadNotifs => unreadNotifs.reduce((dict, curr) => {
      const caseIdStr = curr.caseId.toString()
      const unreadItem = dict[caseIdStr] = dict[caseIdStr] || {messages: 0, updates: 0}
      switch (curr.type) {
        case 'message':
          unreadItem.messages++
          break
        case 'update':
          unreadItem.updates++
      }
      return dict
    }, {}),
    (a, b) => a.length === b.length
  )
  makeCaseGrouping = memoizeOne(
    (caseList, showOpen, onlyAssigned, allNotifs, unreadNotifs) => {
      const openFilter = showOpen ? x => !isClosed(x) : x => isClosed(x)
      const assignedFilter = onlyAssigned ? x => x.assignee === this.props.currentUser.bugzillaCreds.login : x => true

      const caseUpdateTimeDict = this.makeCaseUpdateTimeDict(allNotifs)
      const caseUnreadDict = this.makeCaseUnreadDict(unreadNotifs)

      // Building a unit dictionary to group the cases together
      const unitsDict = caseList.reduce((dict, caseItem) => {
        if (openFilter(caseItem) && assignedFilter(caseItem)) { // Filtering only the cases that match the selection
          const { selectedUnit: unitTitle, selectedUnitBzId: bzId, unitType } = caseItem

          // Pulling the existing or creating a new dictionary entry if none
          const unitDesc = dict[unitTitle] = dict[unitTitle] || {cases: [], bzId, unitType}
          const caseIdStr = caseItem.id.toString()

          // Adding the latest update time to the case for easier sorting later
          unitDesc.cases.push(
            Object.assign({
              latestUpdate: caseUpdateTimeDict[caseIdStr] || 0,
              unreadCounts: caseUnreadDict[caseIdStr]
            }, caseItem)
          )
        }
        return dict
      }, {})

      // Creating a case grouping *array* from the unit dictionary
      return Object.keys(unitsDict).reduce((all, unitTitle) => {
        const { bzId, cases, unitType } = unitsDict[unitTitle]

        // Sorting cases within a unit by the order descending order of last update
        cases.sort((a, b) => b.latestUpdate - a.latestUpdate)
        all.push({
          latestCaseUpdate: cases[0].latestUpdate, // The first case has to be latest due to the previous sort
          hasUnread: !!cases.find(caseItem => !!caseItem.unreadCounts), // true if any case has unreads
          unitType,
          unitTitle,
          bzId,
          cases
        })
        return all
      }, []).sort((a, b) => b.latestCaseUpdate - a.latestCaseUpdate) // Sorting by the latest case update for each
    },
    (a, b) => {
      if (a && b && Array.isArray(a)) {
        return a.length === b.length
      } else {
        return a === b
      }
    }
  )
  render () {
    const { isLoading, dispatch, caseList, allNotifications, unreadNotifications } = this.props
    const { filterStatus, myInvolvement } = this.state
    if (isLoading) return <Preloader />
    const caseGrouping = this.makeCaseGrouping(caseList, filterStatus, myInvolvement, allNotifications, unreadNotifications)
    return (
      <div className='flex flex-column roboto overflow-hidden flex-grow h-100 relative'>
        <UnverifiedWarning />
        <div className='bb b--black-10 overflow-auto flex-grow flex flex-column bg-very-light-gray'>
          <FilterRow
            filterStatus={filterStatus}
            myInvolvement={myInvolvement}
            handleMyInvolvementClicked={this.handleMyInvolvementClicked}
            handleStatusClicked={this.handleStatusClicked}
            filterLabels={['Open', 'Closed', 'Assigned To Me']}
          />
          { !isLoading && caseGrouping.length
            ? <UnitGroupList
              unitGroupList={caseGrouping}
              expandedListRenderer={({allItems}) => (
                <CaseList
                  allCases={allItems}
                  onItemClick={this.handleOnItemClicked}
                />)
              }
              name={'case'}
            /> : (<NoItemMsg item={'case'} />)
          }
        </div>
        <div className='absolute right-1 bottom-2'>
          <FloatingActionButton onClick={() => dispatch(push('/unit'))}>
            <FontIcon className='material-icons'>add</FontIcon>
          </FloatingActionButton>
        </div>
      </div>
    )
  }
}

CaseExplorer.propTypes = {
  caseList: PropTypes.array,
  isLoading: PropTypes.bool,
  casesError: PropTypes.object,
  allNotifications: PropTypes.array.isRequired,
  unreadNotifications: PropTypes.array.isRequired,
  dispatchLoadingResult: PropTypes.func.isRequired
}

let casesError
const connectedWrapper = connect(
  () => ({}) // map redux state to props
)(createContainer(() => { // map meteor state to props
  const casesHandle = Meteor.subscribe(`${collectionName}.associatedWithMe`, {
    onStop: (error) => {
      casesError = error
    }
  })
  const notifsHandle = Meteor.subscribe(`${notifCollName}.myUpdates`)
  return {
    caseList: Cases.find().fetch().map(caseItem => Object.assign({}, caseItem, {
      unitType: (UnitMetaData.findOne({bzName: caseItem.selectedUnit}) || {}).unitType,
      selectedUnitBzId: (UnitMetaData.findOne({bzName: caseItem.selectedUnit}) || {}).bzId
    })),
    allNotifications: notifsHandle.ready() ? CaseNotifications.find().fetch() : [],
    unreadNotifications: notifsHandle.ready() ? CaseNotifications.find({
      markedAsRead: {$ne: true}
    }).fetch() : [],
    isLoading: !casesHandle.ready() || !notifsHandle.ready(),
    currentUser: Meteor.subscribe('users.myBzLogin').ready() ? Meteor.user() : null,
    casesError
  }
}, CaseExplorer))

connectedWrapper.MobileHeader = ({onIconClick}) => (
  <RootAppBar title='Cases' onIconClick={onIconClick} />
)

connectedWrapper.MobileHeader.propTypes = {
  onIconClick: PropTypes.func.isRequired
}

export default withRouter(connectedWrapper)
