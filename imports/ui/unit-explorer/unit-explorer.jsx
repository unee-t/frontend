import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import RootAppBar from '../components/root-app-bar'
import { setDrawerState } from '../general-actions'

class UnitExplorer extends Component {
  render () {
    const { dispatch } = this.props
    return (
      <div className='full-height flex flex-column'>
        <RootAppBar title='My Units' onIconClick={() => dispatch(setDrawerState(true))} />
      </div>
    )
  }
}

export default connect(
  () => ({}) // Redux store to props
)(createContainer(
  () => ({}), // Meteor data to props
  UnitExplorer
))
