import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import { push } from 'react-router-redux'
import FontIcon from 'material-ui/FontIcon'
import MenuItem from 'material-ui/MenuItem'
import RootAppBar from '../components/root-app-bar'
import Preloader from '../preloader/preloader'
import { setDrawerState } from '../general-actions'
import Units, { collectionName } from '../../api/units'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import { Tabs, Tab } from 'material-ui/Tabs'
import SwipeableViews from 'react-swipeable-views'

class UnitsByRoles extends Component {
  render () {
    const { unitsByRoles, showAddBtn, handleUnitClicked, handleAddCaseClicked, administrate } = this.props
    return (
      <div>
        {(unitsByRoles.length !== 0) && (
          <div className='bb b--black-10 bg-very-light-gray f6 fw5 mid-gray pv2 pl2'>
            { administrate ? ('Units I Administrate') : ('Units Involved In') }
          </div>)
        }
        {
          unitsByRoles.map(unitItem => {
            const { id, name, description } = unitItem
            const metaData = unitItem.metaData() || {}
            return (
              <MenuItem key={id} innerDivStyle={{padding: 0}} onClick={() => handleUnitClicked(id)} >
                <div className='mt2 ph2 bb b--very-light-gray br1 w-100 flex items-center pa2'>
                  <FontIcon className='material-icons' color='var(--semi-dark-gray)'>home</FontIcon>
                  <div className='ml3 mv1 semi-dark-gray lh-copy flex-grow overflow-hidden'>
                    <div className='ti1 ellipsis'>{metaData.displayName || name}</div>
                    <div className='ti1 ellipsis silver'>{ metaData.moreInfo || description}&nbsp;</div>
                  </div>
                  { showAddBtn && (
                    <div
                      onClick={evt => {
                        evt.stopPropagation()
                        handleAddCaseClicked(id)
                      }}
                      className='f6 ellipsis ml3 pl1 mv1 bondi-blue fw5 no-shrink'
                    >
                      Add case
                    </div>
                  )}
                </div>
              </MenuItem>
            )
          })
        }
      </div>
    )
  }
}

class FilteredUnitsList extends Component {
  render () {
    const { filteredUnits, currentUserId, active, handleAddCaseClicked, handleUnitClicked, showAddBtn } = this.props
    const administratedUnits = filteredUnits.filter(unit => unit.metaData.ownerIds && unit.metaData.ownerIds.includes(currentUserId))
    const unitsInvolvedIn = filteredUnits.filter(unit => !unit.metaData.ownerIds || !unit.metaData.ownerIds.includes(currentUserId))

    return (
      <div className='flex flex-column'>
        {filteredUnits.length === 0 ? (
          <div className='f6 i silver ba b--moon-gray mt2 pa2 tc br1 mr3 ml3'>
            { active ? ('You have no units managed with Unee-T yet') : ('You have no disabled units') }
          </div>
        ) : <div>
          <UnitsByRoles
            unitsByRoles={administratedUnits}
            handleAddCaseClicked={handleAddCaseClicked}
            handleUnitClicked={handleUnitClicked}
            showAddBtn={showAddBtn}
            administrate
          />
          <UnitsByRoles
            unitsByRoles={unitsInvolvedIn}
            handleAddCaseClicked={handleAddCaseClicked}
            handleUnitClicked={handleUnitClicked}
            showAddBtn={showAddBtn}
          />
        </div>
        }
      </div>
    )
  }
}

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
    const activeUnits = unitList.filter(unitItem => !unitItem.metaData.disabled)
    const disabledUnits = unitList.filter(unitItem => unitItem.metaData.disabled)

    if (isLoading) return <Preloader />

    return (
      <div className='flex flex-column flex-grow full-height'>
        <RootAppBar title='My Units' onIconClick={() => dispatch(setDrawerState(true))} shadowless />
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
              <div className='flex-grow bb b--very-light-gray bg-white'>
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
              <div className='flex-grow bb b--very-light-gray bg-white'>
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

UnitsByRoles.propTypes = {
  unitsByRoles: PropTypes.array,
  handleUnitClicked: PropTypes.func,
  handleAddCaseClicked: PropTypes.func,
  administrate: PropTypes.bool,
  showAddBtn: PropTypes.bool
}

FilteredUnitsList.propTypes = {
  filteredUnits: PropTypes.array,
  currrentUserId: PropTypes.string,
  active: PropTypes.bool,
  handleUnitClicked: PropTypes.func,
  handleAddCaseClicked: PropTypes.func,
  showAddBtn: PropTypes.bool
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
      unitList: Units.find().fetch(),
      isLoading: !unitsHandle.ready(),
      currentUserId: Meteor.userId(),
      unitsError
    }
  }, // Meteor data to props
  UnitExplorer
))
