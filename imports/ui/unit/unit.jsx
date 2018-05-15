import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Meteor } from 'meteor/meteor'
import { createContainer } from 'meteor/react-meteor-data'
import { push } from 'react-router-redux'
import { Route } from 'react-router-dom'
import { Tabs, Tab } from 'material-ui/Tabs'
import SwipeableViews from 'react-swipeable-views'
import MenuItem from 'material-ui/MenuItem'
import FontIcon from 'material-ui/FontIcon'
import { CSSTransition } from 'react-transition-group'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import Units, { collectionName as unitsCollName, getUnitRoles } from '../../api/units'
import Cases, { collectionName as casesCollName } from '../../api/cases'
import InnerAppBar from '../components/inner-app-bar'
import { makeMatchingUser } from '../../api/custom-users'
import Preloader from '../preloader/preloader'
import { infoItemMembers } from '../util/static-info-rendering'
import { userInfoItem } from '../../util/user'

const viewsOrder = ['cases', 'reports', 'overview']

const severityIcons = {
  'DEAL BREAKER!': {
    icon: 'format_align_justify',
    color: 'var(--warn-crimson)'
  },
  'critical': {
    icon: 'reorder',
    color: '#F00000'
  },
  'major': {
    icon: 'dehaze',
    color: '#FF6701'
  },
  'normal': {
    icon: 'drag_handle',
    color: '#4A90E2'
  },
  'minor': {
    icon: 'remove',
    color: '#99CC33'
  }
}

const caseMenuItemDivStyle = {
  display: 'flex',
  alignItems: 'center'
}

class Unit extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      sortedCases: []
    }
  }
  handleChange = val => {
    const { match, dispatch } = this.props
    dispatch(push(`${match.url}/${viewsOrder[val]}`))
  }
  componentWillReceiveProps (nextProps) {
    const { caseList } = this.props
    if ((!caseList && nextProps.caseList) || (caseList && caseList.length !== nextProps.caseList.length)) {
      const severityList = Object.keys(severityIcons)
      this.setState({
        sortedCases: nextProps.caseList.slice().sort((a, b) =>
          severityList.indexOf(a.severity) - severityList.indexOf(b.severity)
        )
      })
    }
  }
  render () {
    const { unitItem, isLoading, unitError, casesError, unitUsers, dispatch, match } = this.props
    const { sortedCases } = this.state

    if (isLoading) return <Preloader />
    if (unitError) return <h1>An error occurred: {unitError.error}</h1>
    if (casesError) return <h1>An error occurred: {casesError.error}</h1>

    // console.log('caseList', caseList)
    return (
      <div className='full-height flex flex-column'>
        <InnerAppBar
          shadowless
          title={unitItem.name}
          onBack={() => dispatch(push(match.url.split('/').slice(0, -1).join('/')))}
        />
        <Route exact path={`${match.url}/:viewName`} children={({ match }) => {
          const viewIdx = match ? viewsOrder.indexOf(match.params.viewName) : 0
          return (
            <div className='flex-grow flex flex-column'>
              <Tabs
                className='no-shrink'
                onChange={this.handleChange}
                value={viewIdx}
                inkBarStyle={{backgroundColor: 'white'}}
              >
                <Tab label={`CASES (${sortedCases.length})`} value={0} />
                <Tab label='REPORTS' value={1} />
                <Tab label='OVERVIEW' value={2} />
              </Tabs>
              <SwipeableViews
                resistance
                style={{flex: 1, display: 'flex', flexDirection: 'column'}}
                containerStyle={{flex: 1}}
                slideStyle={{display: 'flex', flexDirection: 'column'}}
                index={viewIdx}
                onChangeIndex={this.handleChange}
              >
                <div className='flex-grow bg-very-light-gray'>
                  {sortedCases.map(({id, title, severity}) => (
                    <div key={id} className='bb b--very-light-gray bg-white'>
                      <MenuItem innerDivStyle={caseMenuItemDivStyle}>
                        <FontIcon className='material-icons mr2' color={severityIcons[severity].color}>
                          {severityIcons[severity].icon}
                        </FontIcon>
                        <span className='bondi-blue pl1'>{title}</span>
                      </MenuItem>
                    </div>
                  ))}
                </div>
                <div className='flex-grow'>
                  <h1>Nothing here yet...</h1>
                </div>
                <div className='flex-grow bg-very-light-gray'>
                  <div className='bg-white card-shadow-1 pa3'>
                    <div>
                      {infoItemMembers('Unit name', unitItem.name)}
                    </div>
                    <div className='mt3'>
                      {infoItemMembers('Unit group', unitItem.classification)}
                    </div>
                    <div className='mt3'>
                      {infoItemMembers('Unit type', '---')}
                    </div>
                    <div className='mt3'>
                      {infoItemMembers('Additional description', unitItem.description)}
                    </div>
                  </div>
                  <div className='mt2 bg-white card-shadow-1 pa3'>
                    <div className='fw5 silver lh-title'>
                      ADDRESS
                    </div>
                    <div className='mt1'>
                      {infoItemMembers('Address', '---')}
                    </div>
                    <div className='mt3'>
                      {infoItemMembers('City', '---')}
                    </div>
                    <div className='mt3'>
                      {infoItemMembers('Country', '---')}
                    </div>
                    <div className='mt3 flex'>
                      <div className='flex-grow'>
                        {infoItemMembers('State', '---')}
                      </div>
                      <div className='flex-grow'>
                        {infoItemMembers('Zip / Postal code', '---')}
                      </div>
                    </div>
                  </div>
                  <div className='mt2 bg-white card-shadow-1 pa3'>
                    <div className='fw5 silver lh-title'>
                      PEOPLE
                    </div>
                    {unitUsers.map(user => (
                      <div className='mt1' key={user.login}>{userInfoItem(user)}</div>
                    ))}
                  </div>
                </div>
              </SwipeableViews>
              <div className='absolute bottom-2 right-1'>
                <CSSTransition in={viewIdx === 0} timeout={500} classNames='zoom-effect' unmountOnExit>
                  <FloatingActionButton backgroundColor='var(--bondi-blue)' className='zoom-effect'>
                    <FontIcon className='material-icons'>add</FontIcon>
                  </FloatingActionButton>
                </CSSTransition>
              </div>
            </div>
          )
        }} />
      </div>
    )
  }
}
Unit.propTypes = {
  unitItem: PropTypes.object,
  unitError: PropTypes.object,
  casesError: PropTypes.object,
  isLoading: PropTypes.bool,
  unitUsers: PropTypes.array,
  caseList: PropTypes.array
}

let unitError, casesError
export default connect(
  () => ({})
)(createContainer((props) => {
  const { unitId } = props.match.params
  const unitHandle = Meteor.subscribe(`${unitsCollName}.byIdWithUsers`, unitId, {
    onStop: error => {
      unitError = error
    }
  })
  const unitItem = unitHandle.ready() ? Units.findOne({id: parseInt(unitId)}) : null
  let casesHandle
  if (unitItem) {
    casesHandle = Meteor.subscribe(`${casesCollName}.byUnitName`, unitItem.name, {
      onStop: error => {
        casesError = error
      }
    })
  }
  return {
    isLoading: !unitHandle.ready() || !casesHandle.ready(),
    unitUsers: unitItem ? getUnitRoles(unitItem).map(makeMatchingUser) : null,
    caseList: unitItem ? Cases.find({selectedUnit: unitItem.name}).fetch() : null,
    casesError,
    unitError,
    unitItem
  }
}, Unit))
