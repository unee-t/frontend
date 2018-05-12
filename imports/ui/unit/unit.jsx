import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Meteor } from 'meteor/meteor'
import { createContainer } from 'meteor/react-meteor-data'
import { push } from 'react-router-redux'
import { Route } from 'react-router-dom'
import { Tabs, Tab } from 'material-ui/Tabs'
import SwipeableViews from 'react-swipeable-views'
import Units, { collectionName } from '../../api/units'
import InnerAppBar from '../components/inner-app-bar'
import Preloader from '../preloader/preloader'

const viewsOrder = ['cases', 'reports', 'overview']

class Unit extends Component {
  handleChange = val => {
    const { match, dispatch } = this.props
    dispatch(push(`${match.url}/${viewsOrder[val]}`))
  }
  render () {
    const { unitItem, isLoading, unitError, dispatch, match } = this.props
    if (isLoading) return <Preloader />
    if (unitError) return <h1>An error occurred: {unitError.error}</h1>
    return (
      <div className='full-height flex flex-column'>
        <InnerAppBar title={unitItem.name} onBack={() => dispatch(push(match.url.split('/').slice(0, -1).join('/')))} />
        <Route exact path={`${match.url}/:viewName`} children={({ match }) => {
          const viewIdx = match ? viewsOrder.indexOf(match.params.viewName) : 0
          return (
            <div className='flex-grow'>
              <Tabs
                onChange={this.handleChange}
                value={viewIdx}
                inkBarStyle={{backgroundColor: 'white'}}
              >
                <Tab label='CASES' value={0} />
                <Tab label='REPORTS' value={1} />
                <Tab label='OVERVIEW' value={2} />
              </Tabs>
              <SwipeableViews
                index={viewIdx}
                onChangeIndex={this.handleChange}
              >
                <div>
                  <h1>Cases</h1>
                </div>
                <div>
                  <h1>Reports</h1>
                </div>
                <div>
                  <h1>OVERVIEW</h1>
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
  isLoading: PropTypes.bool
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
    unitError,
    unitItem
  }
}, Unit))
