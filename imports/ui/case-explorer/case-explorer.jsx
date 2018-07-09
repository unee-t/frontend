import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import PropTypes from 'prop-types'
import { withRouter, Link } from 'react-router-dom'
import { replace } from 'react-router-redux'
import FontIcon from 'material-ui/FontIcon'
import RaisedButton from 'material-ui/RaisedButton'
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
      unitsDict: {},
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

    if (!isLoading && (!this.props.caseList || this.props.caseList.length !== caseList.length)) {
      const unitsDict = caseList.sort((caseA, caseB) => {
        const aVal = isClosed(caseA) ? 1 : 0
        const bVal = isClosed(caseB) ? 1 : 0
        return aVal - bVal
      }).reduce((dict, caseItem) => {
        const { selectedUnit: unitTitle, selectedUnitBzId: bzId } = caseItem
        const unitDesc = dict[unitTitle] = dict[unitTitle] || {cases: [], bzId}
        unitDesc.cases.push(caseItem)
        return dict
      }, {})
      this.setState({
        unitsDict
      })
    }
  }
  render () {
    const { isLoading, dispatch, match } = this.props
    const { unitsDict, showOpen, expandedUnits, assignedToMe } = this.state
    if (isLoading) return <Preloader />
    const casesFilter = showOpen ? x => !isClosed(x) : x => isClosed(x)
    const assignedFilter = assignedToMe ? x => x.assignee === this.props.currentUser.bugzillaCreds.login : x => x

    return (
      <div className='flex flex-column roboto overflow-hidden flex-grow h-100'>
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
            ? Object.keys(unitsDict).reduce((all, unitTitle) => {
              const isExpanded = expandedUnits.includes(unitTitle)
              const allCases = unitsDict[unitTitle].cases
              const casesToRender = allCases.filter(caseItem => assignedFilter(caseItem) && casesFilter(caseItem))
              if (casesToRender.length > 0) {
                all.push(
                  <div key={unitTitle}>
                    <div className='flex items-center h3 bt b--light-gray bg-white'
                      onClick={evt => this.handleExpandUnit(evt, unitTitle)}>
                      <FontIcon className='material-icons mh3' style={unitIconsStyle}>home</FontIcon>
                      <div className='flex-grow ellipsis mid-gray mr4'>
                        {unitTitle}
                        <div className='flex justify-space'>
                          <div className={'f6 silver mt1 '}>
                            { casesToRender.length } cases
                          </div>
                          {unitsDict[unitTitle].bzId && (
                            <div>
                              <Link
                                className={'f6 link ellipsis ml3 pl1 mv1 bondi-blue fw5 '}
                                to={`/case/new?unit=${unitsDict[unitTitle].bzId}`}>
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
                          allCases={casesToRender}
                          onItemClick={() => dispatch(storeBreadcrumb(match.url))}
                        />
                      </ul>
                    )}
                  </div>
                )
              }
              return all
            }, [])
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
                    <span className='mid-gray b lh-copy'>
                      There are no cases associated with you. To create a new case, select a unit at
                    </span>
                    <RaisedButton
                      fullWidth
                      primary
                      className='mv2'
                      onClick={() => dispatch(replace('/unit'))}
                    >
                      <span className='white f4 b'>Units</span>
                    </RaisedButton>
                    <span className='mid-gray b lh-copy'>
                      Then click on the "+" button
                    </span>
                  </div>
                </div>
              </div>
            )
          }
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
