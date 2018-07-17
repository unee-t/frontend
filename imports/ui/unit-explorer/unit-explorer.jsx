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

function ActiveDisabledFilteredUnits (props) {
  const { filteredUnits, active, dispatch } = props
  return (
    <div className='ph2 flex flex-column'>
      {filteredUnits.length === 0 && active ? (
        <div className='f6 i silver ba b--moon-gray mt2 pa2 tc br1'>
          You have no units managed with Unee-T yet
        </div>
      ) : filteredUnits.map(({ id, name, description, metaData }) => (
        <MenuItem key={id} innerDivStyle={{padding: 0}} onClick={() => dispatch(push(`/unit/${id}`))}>
          <div className='mt2 bb b--very-light-gray br1 w-100 flex items-center pa2'>
            <FontIcon className='material-icons' color='var(--semi-dark-gray)'>home</FontIcon>
            <div className='ml3 mv1 semi-dark-gray lh-copy flex-grow overflow-hidden'>
              <div className='ti1 ellipsis'>{metaData.displayName || name}</div>
              <div className='ti1 ellipsis silver'>{ metaData.moreInfo || description}&nbsp;</div>
            </div>
            <div
              onClick={evt => {
                evt.stopPropagation()
                dispatch(push(`/case/new?unit=${id}`))
              }}
              className='f6 ellipsis ml3 pl1 mv1 bondi-blue fw5 no-shrink'
            >
              Add case
            </div>
          </div>
        </MenuItem>
      ))}
    </div>
  )
}

class UnitExplorer extends Component {
  constructor (props) {
    super(props)
    this.state = {
      slideIndex: 0,
      activeCaseCreation: true
    }
  }

  handleChange = (value) => {
    this.setState({
      slideIndex: value,
      activeCaseCreation: !this.state.activeCaseCreation
    })
  };

  render () {
    const { isLoading, unitList, dispatch } = this.props
    console.log(unitList)
    const { activeCaseCreation } = this.state
    const activeFilter = unitItem => unitItem.is_active === activeCaseCreation
    const filteredUnits = unitList.filter(unitItem => activeFilter(unitItem))

    if (isLoading) return <Preloader />

    return (
      <div className='flex flex-column flex-grow full-height'>
        <RootAppBar title='My Units' onIconClick={() => dispatch(setDrawerState(true))} />
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
                <ActiveDisabledFilteredUnits filteredUnits={filteredUnits} dispatch={dispatch} active={activeCaseCreation} />
              </div>
              {/* tab 2 */}
              <div className='flex-grow bb b--very-light-gray bg-white'>
                <ActiveDisabledFilteredUnits filteredUnits={filteredUnits} dispatch={dispatch} active={activeCaseCreation} />
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

        {/* <div className='flex flex-column flex-grow pa3 bg-very-light-gray'>
          <div className='br2 bg-white card-shadow-1 w-100 pt2 flex flex-column'>
            <div className='ph2 flex flex-column'>
              <h4 className='semi-dark-gray ma0 ml1 fw5 lh-title no-shrink'>ALL UNITS</h4>
              <div className='overflow-auto pb2'>
                {unitList.length === 0 ? (
                  <div className='f6 i silver ba b--moon-gray mt2 pa2 tc br1'>
                    You have no units managed with Unee-T yet
                  </div>
                ) : unitList.map(({ id, name, description, metaData }) => (
                  <MenuItem key={id} innerDivStyle={{padding: 0}} onClick={() => dispatch(push(`/unit/${id}`))}>
                    <div className='mt2 ba b--moon-gray br1 w-100 flex items-center pa2'>
                      <FontIcon className='material-icons' color='var(--semi-dark-gray)'>home</FontIcon>
                      <div className='ml3 mv1 semi-dark-gray lh-copy flex-grow overflow-hidden'>
                        <div className='ti1 ellipsis'>{metaData.displayName || name}</div>
                        <div className='flex'>
                          <div className='ti1 ellipsis flex-grow'>{metaData.moreInfo || description}&nbsp;</div>
                          <div
                            onClick={evt => {
                              evt.stopPropagation()
                              dispatch(push(`/case/new?unit=${id}`))
                            }}
                            className='f6 ellipsis ml3 pl1 mv1 bondi-blue fw5 no-shrink'
                          >
                            Add case
                          </div>
                        </div>
                      </div>
                    </div>
                  </MenuItem>
                ))}
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
        </div> */}
      </div>
    )
  }
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
      unitsError
    }
  }, // Meteor data to props
  UnitExplorer
))
