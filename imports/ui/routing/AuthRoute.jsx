import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import { Meteor } from 'meteor/meteor'
import { Route, Redirect } from 'react-router-dom'

const initTimeout = 500

class ConditionRoute extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      wait: true
    }
  }
  componentWillMount () {
    if (!this.props.loggedIn) {
      setTimeout(() => {
        this.setState({
          wait: false
        })
      }, initTimeout)
    }
  }
  render () {
    const Component = this.props.component
    const rest = Object.assign({}, this.props)
    delete rest.component
    return (
      <Route {...rest} render={props => {
        return (
          this.props.loggedIn ? (
            <Component {...props} />
          ) : !this.state.wait && (
            <Redirect to={{
              pathname: '/',
              state: { from: props.location }
            }} />
          )
        )
      }} />
    )
  }
}

ConditionRoute.propTypes = {
  loggedIn: PropTypes.bool
}

export default connect(
  (state) => ({}) // map redux state to props
)(createContainer(() => ({ // map meteor state to props
  loggedIn: !!Meteor.user()
}), ConditionRoute))
