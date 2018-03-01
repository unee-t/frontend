import React, { Component } from 'react'
import { Route, Switch, Redirect, withRouter } from 'react-router-dom'
import { Dashboard } from './components/dashboard.jsx'
import LoginPage from './login/login.jsx'
import SignupPage from './signup/signup.jsx'
import CaseWizard from './case-wizard/case-wizard'
import InvitationLogin from './invitation-login/invitation-login'
import CaseMaster from './case/case-master'
import { Meteor } from 'meteor/meteor'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { createContainer } from 'meteor/react-meteor-data'

import UnderConstruction from './under-construction.jsx'

class App extends Component {
  render () {
    const { userLoggedIn } = this.props
    return (
      <div className='roboto'>
        {userLoggedIn ? (
          <Switch>
            <Route exact path='/unit/new' component={UnderConstruction} />
            <Route exact path='/dashboard' component={Dashboard} />
            <Route exact path='/case/new' component={CaseWizard} />
            <Route path='/case' component={CaseMaster} />
            <Redirect to='/case' />
          </Switch>
        ) : (
          <Switch>
            <Route exact path='/' component={LoginPage} />
            <Route exact path='/signup' component={SignupPage} />
            <Route exact path='/invitation' component={InvitationLogin} />
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
