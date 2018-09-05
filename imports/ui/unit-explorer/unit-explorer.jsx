import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import PropTypes from 'prop-types'
import UnverifiedWarning from '../components/unverified-warning'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import { push } from 'react-router-redux'
import FontIcon from 'material-ui/FontIcon'
import RootAppBar from '../components/root-app-bar'
import Preloader from '../preloader/preloader'
import { setDrawerState } from '../general-actions'
import Units, { collectionName } from '../../api/units'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import { Tabs, Tab } from 'material-ui/Tabs'
import SwipeableViews from 'react-swipeable-views'
import FilteredUnitsList from './filtered-units-list'

class UnitExplorer extends Component {
  constructor (props) {
    super(props)
    this.state = {
      slideIndex: 0
    }
  }

  handleChange = (value) => {
    this.setState({
      slideIndex: value
    })
  };

  handleAddCaseClicked = (id) => {
    const { dispatch } = this.props
    dispatch(push(`/case/new?unit=${id}`))
  }

  handleUnitClicked = (id) => {
    const { dispatch } = this.props
    dispatch(push(`/unit/${id}`))
  }

  render () {
    const { isLoading, unitList, dispatch, currentUserId } = this.props
    const activeUnits = unitList.filter(unitItem => unitItem.metaData && !unitItem.metaData.disabled)
    const disabledUnits = unitList.filter(unitItem => unitItem.metaData && unitItem.metaData.disabled)

    if (isLoading) return <Preloader />

    return (
      <div className='flex flex-column flex-grow full-height'>
        <RootAppBar title='My Units' onIconClick={() => dispatch(setDrawerState(true))} shadowless />
        <UnverifiedWarning />
        <div className='flex-grow flex flex-column overflow-hidden'>
          <Tabs
            className='no-shrink'
            onChange={this.handleChange}
            value={this.state.slideIndex}
            inkBarStyle={{backgroundColor: 'white'}}
          >
            <Tab label='Active' value={0} />
            <Tab label='Disabled' value={1} />
          </Tabs>

          <div className='flex-grow flex flex-column overflow-auto'>
            <SwipeableViews
              index={this.state.slideIndex}
              onChangeIndex={this.handleChange}
            >
              {/* tab 1 */}
              <div className='flex-grow bb b--very-light-gray bg-white pb6'>
                <FilteredUnitsList
                  filteredUnits={activeUnits}
                  currentUserId={currentUserId}
                  handleUnitClicked={this.handleUnitClicked}
                  handleAddCaseClicked={this.handleAddCaseClicked}
                  showAddBtn
                  active
                />
              </div>
              {/* tab 2 */}
              <div className='flex-grow bb b--very-light-gray bg-white pb6'>
                <FilteredUnitsList
                  filteredUnits={disabledUnits}
                  currentUserId={currentUserId}
                  handleUnitClicked={this.handleUnitClicked}
                />
              </div>
            </SwipeableViews>
          </div>
        </div>
        <div className='absolute bottom-2 right-2'>
          <FloatingActionButton
            onClick={() => dispatch(push(`/unit/new`))}
          >
            <FontIcon className='material-icons'>add</FontIcon>
          </FloatingActionButton>
        </div>
      </div>
    )
  }
}

UnitExplorer.propTypes = {
  unitList: PropTypes.array,
  isLoading: PropTypes.bool,
  unitsError: PropTypes.object,
  currentUserId: PropTypes.string
}

let unitsError
export default connect(
  () => ({}) // Redux store to props
)(createContainer(
  () => {
    const unitsHandle = Meteor.subscribe(`${collectionName}.forBrowsing`, {
      onStop: (error) => {
        unitsError = error
      }
    })
    return {
      unitList: Units.find().fetch().map(unit => Object.assign({}, unit, {
        metaData: unit.metaData()
      })),
      isLoading: !unitsHandle.ready(),
      currentUserId: Meteor.userId(),
      unitsError
    }
  }, // Meteor data to props
  UnitExplorer
))
