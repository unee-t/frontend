import React, { Component } from 'react'
import { Route, Switch, Redirect, withRouter } from 'react-router-dom'
import { Dashboard } from './components/dashboard.jsx'
import Case from './case/case.jsx'
import LoginPage from './login/login.jsx'
import SignupPage from './signup/signup.jsx'
import CaseExplorer from './case-explorer/case-explorer'
import CaseWizard from './case-wizard/case-wizard'
import { Meteor } from 'meteor/meteor'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { createContainer } from 'meteor/react-meteor-data'

import UnderConstruction from './under-construction.jsx'

class App extends Component {
  render () {
    const { userLoggedIn } = this.props
    return (
      <div className='sans-serif'>
        {userLoggedIn ? (
          <Switch>
            <Route exact path='/unit/new' component={UnderConstruction} />
            <Route exact path='/dashboard' component={Dashboard} />
            <Route exact path='/case' component={CaseExplorer} />
            <Route exact path='/case/new' component={CaseWizard} />
            <Route path='/case/:caseId' component={Case} />
            <Redirect to='/case' />
          </Switch>
        ) : (
          <Switch>
            <Route exact path='/' component={LoginPage} />
            <Route exact path='/signup' component={SignupPage} />
            <Redirect to='/' />
          </Switch>
        )}
      </div>
    )
  }
}

App.propTypes = {
  userLoggedIn: PropTypes.bool
}

// export default App
export default withRouter(connect(
  (state) => ({}) // map redux state to props
)(createContainer(() => ({ // map meteor state to props
  userLoggedIn: !!Meteor.userId()
}), App)))
