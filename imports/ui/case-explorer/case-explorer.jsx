import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import PropTypes from 'prop-types'
import { withRouter, Link } from 'react-router-dom'
import { push } from 'react-router-redux'
import FontIcon from 'material-ui/FontIcon'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import memoizeOne from 'memoize-one'
import Cases, { collectionName, isClosed } from '../../api/cases'
import CaseNotifications, { collectionName as notifCollName } from '../../api/case-notifications'
import UnitMetaData from '../../api/unit-meta-data'
import RootAppBar from '../components/root-app-bar'
import Preloader from '../preloader/preloader'
import { storeBreadcrumb } from '../general-actions'
import { CaseList } from '../case-explorer/case-list'
import {
  unitIconsStyle
} from './case-explorer.mui-styles'

class CaseExplorer extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      caseId: '',
      expandedUnits: [],
      showOpen: true,
      assignedToMe: false
    }
  }

  handleStatusClicked (value) {
    this.setState({ showOpen: value })
  }

  handleAssignedClicked () {
    this.setState({ assignedToMe: !this.state.assignedToMe })
  }

  handleExpandUnit (evt, unitTitle) {
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
          const { selectedUnit: unitTitle, selectedUnitBzId: bzId } = caseItem

          // Pulling the existing or creating a new dictionary entry if none
          const unitDesc = dict[unitTitle] = dict[unitTitle] || {cases: [], bzId}
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
        const { bzId, cases } = unitsDict[unitTitle]

        // Sorting cases within a unit by the order descending order of last update
        cases.sort((a, b) => b.latestUpdate - a.latestUpdate)
        all.push({
          latestCaseUpdate: cases[0].latestUpdate, // The first case has to be latest due to the previous sort
          hasUnread: !!cases.find(caseItem => !!caseItem.unreadCounts), // true if any case has unreads
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
    const { isLoading, dispatch, match, caseList, allNotifications, unreadNotifications } = this.props
    const { showOpen, expandedUnits, assignedToMe } = this.state
    if (isLoading) return <Preloader />
    const caseGrouping = this.makeCaseGrouping(caseList, showOpen, assignedToMe, allNotifications, unreadNotifications)
    return (
      <div className='flex flex-column roboto overflow-hidden flex-grow h-100 relative'>
        <div className='bb b--black-10 overflow-auto flex-grow flex flex-column bg-very-light-gray'>
          <div className='flex pl3 pv3 bb b--very-light-gray bg-white'>
            <div
              onClick={() => this.handleStatusClicked(true)}
              className={'f6 fw5 ph2 ' + (showOpen ? 'mid-gray' : 'silver')}
            >
              Open
            </div>
            <div
              onClick={() => this.handleStatusClicked(false)}
              className={'f6 fw5 ml4 ph2 ' + (!showOpen ? 'mid-gray' : 'silver')}
            >
              Closed
            </div>
            <div
              onClick={() => this.handleAssignedClicked()}
              className={'f6 fw5 ml4 ph2 ' + (assignedToMe ? 'mid-gray' : 'silver')}
            >
              Assigned To Me
            </div>
          </div>
          {!isLoading && caseGrouping.length
            ? caseGrouping.map(({ unitTitle, bzId, hasUnread, cases: unitCases }) => {
              const isExpanded = expandedUnits.includes(unitTitle)
              return (
                <div key={unitTitle}>
                  <div className='flex items-center h3 bt b--light-gray bg-white'
                    onClick={evt => this.handleExpandUnit(evt, unitTitle)}>
                    <FontIcon className='material-icons mh3' style={unitIconsStyle}>home</FontIcon>
                    <div className='flex-grow ellipsis mid-gray mr4'>
                      {unitTitle}
                      <div className='flex justify-space'>
                        <div className={'f6 silver mt1' + (hasUnread ? ' b' : '')}>
                          { unitCases.length } cases
                        </div>
                        {bzId && (
                          <div className='no-shrink flex items-center'>
                            <Link
                              className='f6 link ellipsis ml3 pl1 mv1 bondi-blue fw5'
                              to={`/case/new?unit=${bzId}`}>
                              Add case
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <ul className='list bg-light-gray ma0 pl0 shadow-in-top-1'>
                      <CaseList
                        allCases={unitCases}
                        onItemClick={() => dispatch(storeBreadcrumb(match.url))}
                      />
                    </ul>
                  )}
                </div>
              )
            })
            : (
              <div className='flex-grow flex flex-column items-center justify-center'>
                <div className='tc'>
                  <div className='dib relative'>
                    <FontIcon className='material-icons' color='var(--moon-gray)' style={{fontSize: '6rem'}}>
                      card_travel
                    </FontIcon>
                    <div className='absolute bottom--1 right--1 pb2'>
                      <div className='br-100 pa1 bg-very-light-gray lh-cram'>
                        <FontIcon className='material-icons' color='var(--moon-gray)' style={{fontSize: '2.5rem'}}>
                          add_circle
                        </FontIcon>
                      </div>
                    </div>
                  </div>
                  <div className='mt3 ph4'>
                    <div className='mid-gray b lh-copy'>
                      <div>There are no cases that match your current filter combination.</div>
                      <div>Click on the "+" button to select a unit to add a new case</div>
                    </div>
                  </div>
                </div>
              </div>
            )
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
