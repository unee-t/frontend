import React from 'react'
import { Route, Switch, Redirect } from 'react-router-dom'
import { Dashboard } from './components/dashboard.jsx'
import Case from './case/case.jsx'
import LoginPage from './login/login.jsx'
import SignupPage from './signup/signup.jsx'

import UnderConstruction from './under-construction.jsx'

const App = () => (
  <div className='sans-serif'>
    <Switch>
      <Route exact path='/' component={LoginPage} />
      <Route exact path='/signup' component={SignupPage} />
      <Route exact path='/unit/new' component={UnderConstruction} />
      <Route exact path='/dashboard' component={Dashboard} />
      <Route exact path='/case/:caseId' component={Case} />
      <Redirect to='/' />
    </Switch>
  </div>
)

export default App
