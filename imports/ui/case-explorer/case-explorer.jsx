import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import PropTypes from 'prop-types'
import UnverifiedWarning from '../components/unverified-warning'
import { withRouter } from 'react-router-dom'
import FontIcon from 'material-ui/FontIcon'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import memoizeOne from 'memoize-one'
import Cases, { collectionName, isClosed } from '../../api/cases'
import CaseNotifications, { collectionName as notifCollName } from '../../api/case-notifications'
import UnitMetaData from '../../api/unit-meta-data'
import RootAppBar from '../components/root-app-bar'
import Preloader from '../preloader/preloader'
import { NoItemMsg } from '../explorer-components/no-item-msg'
import { UnitGroupList } from '../explorer-components/unit-group-list'
import { storeBreadcrumb } from '../general-actions'
import { CaseList } from '../case-explorer/case-list'
import UnitSelectDialog from '../dialogs/unit-select-dialog'
import { push } from 'react-router-redux'
import { SORT_BY, sorters, labels } from '../explorer-components/sort-items'
import { RoleFilter } from '../explorer-components/role-filter'
import { Sorter } from '../explorer-components/sorter'

class CaseExplorer extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      caseId: '',
      open: false,
      selectedRoleFilter: null,
      sortBy: null
    }
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

  handleOnItemClicked = () => {
    const { dispatch, match } = this.props
    dispatch(storeBreadcrumb(match.url))
  }

  handleOnUnitClicked = (unitId) => {
    const { dispatch } = this.props
    dispatch(push(`/case/new?unit=${unitId}`))
  }

  componentWillReceiveProps ({ isLoading, casesError, caseList }) {
    if (!isLoading && !casesError && isLoading !== this.props.isLoading) {
      this.props.dispatchLoadingResult({ caseList })
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
      const unreadItem = dict[caseIdStr] = dict[caseIdStr] || { messages: 0, updates: 0 }
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
    ({ caseList, selectedRoleFilter, sortBy, allNotifs, unreadNotifs }) => {
      const assignedFilter = selectedRoleFilter !== 'Assigned to me' ? x => true : x => x.assignee === this.props.currentUser.bugzillaCreds.login
      const caseUpdateTimeDict = this.makeCaseUpdateTimeDict(allNotifs)
      const caseUnreadDict = this.makeCaseUnreadDict(unreadNotifs)

      // Building a unit dictionary to group the cases together
      const unitsDict = caseList.reduce((dict, caseItem) => {
        if (assignedFilter(caseItem) && !isClosed(caseItem)) { // Filtering only the cases that match the selection
          const { selectedUnit: unitTitle, selectedUnitBzId: bzId, unitType } = caseItem
          // Pulling the existing or creating a new dictionary entry if none
          const unitDesc = dict[unitTitle] = dict[unitTitle] || { cases: [], bzId, unitType }
          const caseIdStr = caseItem.id.toString()

          // Adding the latest update time to the case for easier sorting later
          unitDesc.cases.push(
            Object.assign({
              latestUpdate: caseUpdateTimeDict[caseIdStr] || (new Date(caseItem.creation_time)).getTime(),
              unreadCounts: caseUnreadDict[caseIdStr]
            }, caseItem)
          )
        }
        return dict
      }, {})
      const sortType = sortBy ? sorters[sortBy] : sorters[SORT_BY.LATEST_UPDATE]
      return Object.keys(unitsDict).reduce((all, unitTitle) => {
        const { bzId, cases, unitType } = unitsDict[unitTitle]
        // Sorting cases within a unit by the order descending order of last update
        cases.sort(sortType)
        all.push({
          latestCaseUpdate: cases[0].latestUpdate, // The first case has to be latest due to the previous sort
          hasUnread: !!cases.find(caseItem => !!caseItem.unreadCounts), // true if any case has unreads
          items: cases,
          unitType,
          unitTitle,
          bzId
        })
        return all
      }, []).sort(sortType)
    },
    (a, b) => {
      return Object.keys(a).every(key => {
        const aAttr = a[key]
        const bAttr = b[key]
        if (key === 'caseList') {
          if (Array.isArray(aAttr) && Array.isArray(bAttr)) {
            return aAttr.length === bAttr.length && aAttr.filter(isClosed).length === bAttr.filter(isClosed).length
          } else {
            return true
          }
        } else if (aAttr && bAttr && Array.isArray(aAttr)) {
          return aAttr.length === bAttr.length
        } else {
          return aAttr === bAttr
        }
      })
    }
  )
  render () {
    const { isLoading, caseList, allNotifications, unreadNotifications } = this.props
    const { selectedRoleFilter, sortBy, open } = this.state
    if (isLoading) return <Preloader />

    const caseGrouping = this.makeCaseGrouping({
      caseList,
      selectedRoleFilter,
      sortBy,
      allNotifs: allNotifications,
      unreadNotifs: unreadNotifications
    })
    return (
      <div className='flex flex-column roboto overflow-hidden flex-grow h-100 relative'>
        <UnverifiedWarning />
        <div className='flex bg-very-light-gray'>
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
        <div className='bb b--black-10 overflow-auto flex-grow flex flex-column bg-very-light-gray pb6'>
          { !isLoading && caseGrouping.length
            ? <UnitGroupList
              unitGroupList={caseGrouping}
              expandedListRenderer={({ allItems }) => (
                <CaseList
                  allCases={allItems}
                  onItemClick={this.handleOnItemClicked}
                />)
              }
              name={'case'}
            /> : (<NoItemMsg item={'case'} iconType={'card_travel'} buttonOption />)
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
  const casesHandle = Meteor.subscribe(`${collectionName}.associatedWithMe`, { showOpenOnly: true }, {
    onStop: (error) => {
      casesError = error
    }
  })
  const notifsHandle = Meteor.subscribe(`${notifCollName}.myUpdates`)
  return {
    caseList: Cases.find().fetch().map(caseItem => Object.assign({}, caseItem, {
      unitType: (UnitMetaData.findOne({ bzName: caseItem.selectedUnit }) || {}).unitType,
      selectedUnitBzId: (UnitMetaData.findOne({ bzName: caseItem.selectedUnit }) || {}).bzId
    })),
    allNotifications: notifsHandle.ready() ? CaseNotifications.find().fetch() : [],
    unreadNotifications: notifsHandle.ready() ? CaseNotifications.find({
      markedAsRead: { $ne: true }
    }).fetch() : [],
    isLoading: !casesHandle.ready() || !notifsHandle.ready(),
    currentUser: Meteor.subscribe('users.myBzLogin').ready() ? Meteor.user() : null,
    casesError
  }
}, CaseExplorer))

connectedWrapper.MobileHeader = ({ onIconClick }) => (
  <RootAppBar title='Open Cases' onIconClick={onIconClick} />
)

connectedWrapper.MobileHeader.propTypes = {
  onIconClick: PropTypes.func.isRequired
}

export default withRouter(connectedWrapper)
