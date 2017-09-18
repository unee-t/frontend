import React from 'react'
import { Link, Route } from 'react-router-dom'
import { Dashboard } from './components/dashboard.jsx'
import Claim from './claim/claim.jsx'
import LoginPage from './login/login.jsx'
import SignupPage from './signup/signup.jsx'

import UnderConstruction from './under-construction.jsx'

export const App = () => (
  <div className='sans-serif'>
    <Route exact path='/' component={LoginPage} />
    <Route exact path='/signup' component={SignupPage} />
    <Route exact path='/unit/new' component={UnderConstruction} />
    <Route exact path='/dashboard' component={Dashboard} />
    <Route exact path='/demo-claim' component={Claim} />
  </div>
)
