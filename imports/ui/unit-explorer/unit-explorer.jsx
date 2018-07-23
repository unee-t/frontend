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
import UnitMetaData from '../../api/unit-meta-data'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import { Tabs, Tab } from 'material-ui/Tabs'
import SwipeableViews from 'react-swipeable-views'

class FilteredUnitsList extends Component {
  handleUnitClicked (id) {
    console.log('id', id)
    const { dispatch } = this.props
    dispatch(push(`/unit/${id}`))
  }

  handleAddCaseClicked (evt, id) {
    const { dispatch } = this.props
    evt.stopPropagation()
    dispatch(push(`/case/new?unit=${id}`))
  }

  render () {
    const { filteredUnits, value, currentUser } = this.props
    const unitswithMetaData = filteredUnits.filter(x => x.metaData.ownerIds)
    const unitsIAdministrate = unitswithMetaData.filter(x => x.metaData.ownerIds.includes(currentUser))
    const participantUnits = unitswithMetaData.filter(x => !x.metaData.ownerIds.includes(currentUser))
    const unitswithoutMetaData = filteredUnits.filter(a => unitsIAdministrate.filter(b => a.id === b.id).length === 0)
    const unitsInvolvedIn = unitswithoutMetaData.concat(participantUnits)

    return (
      <div className='flex flex-column'>
        {filteredUnits.length === 0 ? (
          <div className='f6 i silver ba b--moon-gray mt2 pa2 tc br1'>
            {!value ? ('You have no units managed with Unee-T yet') : ('you have no disabled units') }
          </div>
        ) : <div>
          <div>
            {unitsIAdministrate.length === 0 ? (undefined) : (
              <div className='bb b--black-10 bg-very-light-gray f6 fw5 mid-gray pv2 pl2'>
                Units I Administrate
              </div>
            )
            }
            {
              unitsIAdministrate.map(({ id, name, description, metaData }) => (
                <MenuItem key={id} innerDivStyle={{padding: 0}} onClick={() => this.handleUnitClicked(id)} >
                  <div className='mt2 ph2 bb b--very-light-gray br1 w-100 flex items-center pa2'>
                    <FontIcon className='material-icons' color='var(--semi-dark-gray)'>home</FontIcon>
                    <div className='ml3 mv1 semi-dark-gray lh-copy flex-grow overflow-hidden'>
                      <div className='ti1 ellipsis'>{metaData.displayName || name}</div>
                      <div className='ti1 ellipsis silver'>{ metaData.moreInfo || description}&nbsp;</div>
                    </div>
                    { !value ? (
                      <div
                        onClick={evt => this.handleAddCaseClicked(evt, id)}
                        className='f6 ellipsis ml3 pl1 mv1 bondi-blue fw5 no-shrink'
                      >
                        Add case
                      </div>
                    ) : (undefined)
                    }
                  </div>
                </MenuItem>
              ))}
          </div>
          <div>
            {unitsInvolvedIn.length === 0 ? (undefined) : (
              <div className='bb b--black-10 bg-very-light-gray f6 fw5 mid-gray pv2 pl2'>
                Units Involved In
              </div>
            )
            }
            {
              unitsInvolvedIn.map(({ id, name, description, metaData }) => (
                <MenuItem key={id} innerDivStyle={{padding: 0}} onClick={() => this.handleUnitClicked(id)}>
                  <div className='mt2 ph2 bb b--very-light-gray br1 w-100 flex items-center pa2'>
                    <FontIcon className='material-icons' color='var(--semi-dark-gray)'>home</FontIcon>
                    <div className='ml3 mv1 semi-dark-gray lh-copy flex-grow overflow-hidden'>
                      <div className='ti1 ellipsis'>{metaData.displayName || name}</div>
                      <div className='ti1 ellipsis silver'>{ metaData.moreInfo || description}&nbsp;</div>
                    </div>
                    { !value ? (
                      <div
                        onClick={evt => this.handleAddCaseClicked(evt, id)}
                        className='f6 ellipsis ml3 pl1 mv1 bondi-blue fw5 no-shrink'
                      >
                        Add case
                      </div>
                    ) : (undefined)
                    }
                  </div>
                </MenuItem>
              ))}
          </div>
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

  render () {
    const { isLoading, unitList, dispatch, currentUser } = this.props
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
                <FilteredUnitsList filteredUnits={activeUnits} dispatch={dispatch} currentUser={currentUser} />
              </div>
              {/* tab 2 */}
              <div className='flex-grow bb b--very-light-gray bg-white'>
                <FilteredUnitsList filteredUnits={disabledUnits} dispatch={dispatch} currentUser={currentUser} value={this.state.slideIndex} />
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

FilteredUnitsList.propTypes = {
  filteredUnits: PropTypes.array,
  currrentUser: PropTypes.string,
  value: PropTypes.number

}

UnitExplorer.propTypes = {
  unitList: PropTypes.array,
  isLoading: PropTypes.bool,
  unitsError: PropTypes.object
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
        metaData: UnitMetaData.findOne({bzId: unit.id}) || {}
      })),
      isLoading: !unitsHandle.ready(),
      currentUser: Meteor.userId(),
      unitsError
    }
  }, // Meteor data to props
  UnitExplorer
))
