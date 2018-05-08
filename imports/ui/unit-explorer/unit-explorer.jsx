import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import InnerAppBar from '../components/inner-app-bar'
import { goBack } from 'react-router-redux'

class UnitExplorer extends Component {
  render () {
    const { dispatch } = this.props
    return (
      <div className='full-height flex flex-column'>
        <InnerAppBar title='My Units' onBack={() => dispatch(goBack())} />
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
