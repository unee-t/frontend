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
  makeUnitsDict = memoizeOne(
    (caseList, showOpen, onlyAssigned) => {
      const openFilter = showOpen ? x => !isClosed(x) : x => isClosed(x)
      const assignedFilter = onlyAssigned ? x => x.assignee === this.props.currentUser.bugzillaCreds.login : x => x
      return caseList.reduce((dict, caseItem) => {
        if (openFilter(caseItem) && assignedFilter(caseItem)) {
          const { selectedUnit: unitTitle, selectedUnitBzId: bzId } = caseItem
          const unitDesc = dict[unitTitle] = dict[unitTitle] || {cases: [], bzId}
          unitDesc.cases.push(caseItem)
        }
        return dict
      }, {})
    }
  )
  render () {
    const { isLoading, dispatch, match, caseList } = this.props
    const { showOpen, expandedUnits, assignedToMe } = this.state
    if (isLoading) return <Preloader />
    const unitsDict = this.makeUnitsDict(caseList, showOpen, assignedToMe)
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
          {!isLoading && Object.keys(unitsDict).length
            ? Object.keys(unitsDict).map(unitTitle => {
              const isExpanded = expandedUnits.includes(unitTitle)
              const { bzId, cases: unitCases } = unitsDict[unitTitle]
              return (
                <div key={unitTitle}>
                  <div className='flex items-center h3 bt b--light-gray bg-white'
                    onClick={evt => this.handleExpandUnit(evt, unitTitle)}>
                    <FontIcon className='material-icons mh3' style={unitIconsStyle}>home</FontIcon>
                    <div className='flex-grow ellipsis mid-gray mr4'>
                      {unitTitle}
                      <div className='flex justify-space'>
                        <div className={'f6 silver mt1 '}>
                          { unitCases.length } cases
                        </div>
                        {bzId && (
                          <div>
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
          <FloatingActionButton
            onClick={() => dispatch(push('/unit'))}
          >
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
  return {
    caseList: Cases.find().fetch().map(caseItem => Object.assign({}, caseItem, {
      selectedUnitBzId: (UnitMetaData.findOne({bzName: caseItem.selectedUnit}) || {}).bzId
    })),
    isLoading: !casesHandle.ready(),
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
