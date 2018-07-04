import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import PropTypes from 'prop-types'
import { withRouter, Link } from 'react-router-dom'
import FontIcon from 'material-ui/FontIcon'
import RaisedButton from 'material-ui/RaisedButton'
import Cases, { collectionName, isClosed } from '../../api/cases'
import { push } from 'react-router-redux'
import RootAppBar from '../components/root-app-bar'
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
      showOpen: true
    }
  }

  handleStatusClicked (value) {
    this.setState({ showOpen: value })
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
        const { selectedUnit: unitTitle } = caseItem
        const unitCases = dict[unitTitle] = dict[unitTitle] || []
        unitCases.push(caseItem)
        return dict
      }, {})
      this.setState({
        unitsDict
      })
    }
  }
  render () {
    const { isLoading, dispatch, match } = this.props
    const { unitsDict, showOpen, expandedUnits } = this.state
    const casesFilterFunc = showOpen ? x => !isClosed(x) : x => isClosed(x)

    return (
      <div className='flex flex-column roboto overflow-hidden flex-grow h-100'>
        <div className='bb b--black-10 overflow-auto flex-grow'>
          <div className='flex pl3 pv3 bb b--very-light-gray'>
            <div onClick={() => this.handleStatusClicked(true)} className={'f6 fw5 ' + (showOpen ? 'mid-gray' : 'silver')}> Open </div>
            <div onClick={() => this.handleStatusClicked(false)} className={'f6 fw5 ml4 ' + (!showOpen ? 'mid-gray' : 'silver')}> Closed </div>
          </div>
          {!isLoading && Object.keys(unitsDict)
            .reduce((all, unitTitle) => {
              const isExpanded = expandedUnits.includes(unitTitle)
              const allCases = unitsDict[unitTitle]
              const hasCases = allCases.filter(casesFilterFunc)
              if (hasCases.length > 0) {
                all.push(
                  <div key={unitTitle}>
                    <div className='flex items-center h3 bt b--light-gray'
                      onClick={evt => this.handleExpandUnit(evt, unitTitle)}>
                      <FontIcon className='material-icons mh3' style={unitIconsStyle}>home</FontIcon>
                      <div className='flex-grow ellipsis mid-gray mr4'>
                        {unitTitle}
                        <div className='flex justify-space'>
                          <div className={'f6 silver mt1 '}>
                            { hasCases.length } cases
                          </div>
                          <div>
                            <Link
                              className={'f6 link ellipsis ml3 pl1 mv1 bondi-blue fw5 '}
                              to={{
                                pathname: '/case/new',
                                state: { unitTitle: unitTitle }
                              }}>
                              Add case
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <ul className='list bg-light-gray ma0 pl0 shadow-in-top-1'>
                        <CaseList
                          allCases={hasCases}
                          onItemClick={() => dispatch(storeBreadcrumb(match.url))}
                        />
                      </ul>
                    )}
                  </div>
                )
              }
              return all
            }, [])}
        </div>
        {!isLoading && (
          <RaisedButton fullWidth backgroundColor='var(--bondi-blue)' onClick={() => dispatch(push('/case/new'))}>
            <span className='white f4 b'>
              Create New Case
            </span>
          </RaisedButton>
        )}
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
    caseList: Cases.find().fetch(),
    isLoading: !casesHandle.ready(),
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
