import React from 'react'
import { Link, Route } from 'react-router-dom'
import { Dashboard } from './components/dashboard.jsx'
import App from './app.jsx'

export class Routes extends React.Component {
  render () {
    return (
      <div>
        <Route exact path='/' component={Dashboard} />
        <Route exact path='/todo' component={App} />
        <nav>
          <Link to='/'>Dashboard</Link>
        </nav>
      </div>
    )
  }
}
