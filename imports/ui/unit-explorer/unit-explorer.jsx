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
import FilteredUnitsContainer from './filtered-units-container'
import FilteredUnits from './filtered-units'

class UnitExplorer extends Component {
  constructor (props) {
    super(props)
    this.state = {
      slideIndex: 0,
      searchResult: [],
      searchMode: false,
      searchText: ''
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

  onSearchChanged = (searchText) => {
    this.setState({searchText})
    if (searchText === '') {
      this.setState({searchMode: false})
    } else {
      this.setState({searchMode: true})
      const matcher = new RegExp(searchText, 'i')
      const searchResult = this.props.unitList
        .filter(unit => !matcher || (unit.name && unit.name.match(matcher)))
      this.setState({
        searchResult: searchResult
      })
    }
  }

  render () {
    const { isLoading, unitList, dispatch, currentUserId } = this.props
    const { searchResult, searchMode, searchText } = this.state
    if (isLoading) return <Preloader />
    const activeUnits = unitList.filter(unitItem => unitItem.metaData && !unitItem.metaData.disabled)
    const disabledUnits = unitList.filter(unitItem => unitItem.metaData && unitItem.metaData.disabled)
    return (
      <div className='flex flex-column flex-grow full-height'>
        <RootAppBar
          title='My Units'
          placeholder='Search units...'
          onIconClick={() => dispatch(setDrawerState(true))}
          shadowless
          searchText={searchText}
          onSearchChanged={this.onSearchChanged}
          showSearch
        />
        <UnverifiedWarning />
        { searchMode ? (
          <FilteredUnits filteredUnits={searchResult}
            titleMode={0}
            handleUnitClicked={this.handleUnitClicked}
          />
        ) : (
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
                  <FilteredUnitsContainer
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
                  <FilteredUnitsContainer
                    filteredUnits={disabledUnits}
                    currentUserId={currentUserId}
                    handleUnitClicked={this.handleUnitClicked}
                  />
                </div>
              </SwipeableViews>
            </div>
          </div>
        ) }
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
