import React from 'react'
import { Link, Route } from 'react-router-dom'
import { Dashboard } from './components/dashboard.jsx'
import Claim from './claim/claim.jsx'
import App from './todo/app.jsx'
import LoginPage from './login/login.jsx'
import SignupPage from './signup/signup.jsx'

import UnderConstruction from './under-construction.jsx'

import AccountsUIWrapper from './accounts-ui-wrapper.jsx'

export class Routes extends React.Component {
  render () {
    return (
      <div className='sans-serif'>
        <AccountsUIWrapper />
        <Route exact path='/' component={LoginPage} />
        <Route exact path='/signup' component={SignupPage} />
        <Route exact path='/unit/new' component={UnderConstruction} />
        <Route exact path='/dashboard' component={Dashboard} />
        <Route exact path='/demo-claim' component={Claim} />
        <Route exact path='/todo' component={App} />
        <nav>
          <Link to='/'>Dashboard</Link>
        </nav>
      </div>
    )
  }
}
