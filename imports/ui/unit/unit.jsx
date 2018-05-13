import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Meteor } from 'meteor/meteor'
import { createContainer } from 'meteor/react-meteor-data'
import { push } from 'react-router-redux'
import { Route } from 'react-router-dom'
import { Tabs, Tab } from 'material-ui/Tabs'
import SwipeableViews from 'react-swipeable-views'
import Units, { collectionName, getUnitRoles } from '../../api/units'
import InnerAppBar from '../components/inner-app-bar'
import { makeMatchingUser } from '../../api/custom-users'
import Preloader from '../preloader/preloader'
import { infoItemMembers } from '../util/static-info-rendering'
import { userInfoItem } from '../../util/user'

const viewsOrder = ['cases', 'reports', 'overview']

class Unit extends Component {
  handleChange = val => {
    const { match, dispatch } = this.props
    dispatch(push(`${match.url}/${viewsOrder[val]}`))
  }
  render () {
    const { unitItem, isLoading, unitError, unitUsers, dispatch, match } = this.props

    if (isLoading) return <Preloader />
    if (unitError) return <h1>An error occurred: {unitError.error}</h1>
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
                <Tab label='CASES' value={0} />
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
                <div className='flex-grow'>
                  <h1>Cases</h1>
                </div>
                <div className='flex-grow'>
                  <h1>Reports</h1>
                </div>
                <div className='flex-grow bg-very-light-gray'>
                  <div className='bg-white card-shadow-1 pa3'>
                    <div>
                      {infoItemMembers('Unit name', unitItem.name)}
                    </div>
                    <div className='mt3'>
                      {infoItemMembers('Unit type', unitItem.classification)}
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
  isLoading: PropTypes.bool,
  unitUsers: PropTypes.array
}

let unitError
export default connect(
  () => ({})
)(createContainer((props) => {
  const { unitId } = props.match.params
  const unitHandle = Meteor.subscribe(`${collectionName}.byIdWithUsers`, unitId, {
    onStop: error => {
      unitError = error
    }
  })
  const unitItem = unitHandle.ready() ? Units.findOne({id: parseInt(unitId)}) : null
  return {
    isLoading: !unitHandle.ready(),
    unitUsers: unitItem ? getUnitRoles(unitItem).map(makeMatchingUser) : null,
    unitError,
    unitItem
  }
}, Unit))
