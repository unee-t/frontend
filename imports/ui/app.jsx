import React, { Component } from 'react'
import { Route, Switch, Redirect } from 'react-router-dom'
import { Dashboard } from './components/dashboard.jsx'
import Case from './case/case.jsx'
import LoginPage from './login/login.jsx'
import SignupPage from './signup/signup.jsx'
import CaseExplorer from './case-explorer/case-explorer'
import AuthRoute from './routing/AuthRoute'

import UnderConstruction from './under-construction.jsx'

class App extends Component {
  render () {
    return (
      <div className='sans-serif'>
        <Switch>
          <Route exact path='/' component={LoginPage} />
          <Route exact path='/signup' component={SignupPage} />
          <Route exact path='/unit/new' component={UnderConstruction} />
          <Route exact path='/dashboard' component={Dashboard} />
          <AuthRoute exact path='/case' component={CaseExplorer} />
          <AuthRoute exact path='/case/:caseId' component={Case} />
          <Redirect to='/' />
        </Switch>
      </div>
    )
  }
}

export default App
