import React, { Component } from 'react'
import { Route, Switch, Redirect, withRouter } from 'react-router-dom'
import { Meteor } from 'meteor/meteor'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { createContainer } from 'meteor/react-meteor-data'

import { Dashboard } from './components/dashboard.jsx'
import LoginPage from './login/login.jsx'
import SignupPage from './signup/signup.jsx'
import CaseWizard from './case-wizard/case-wizard'
import InvitationLogin from './invitation-login/invitation-login'
import CaseMaster from './case/case-master'
import ResetPass from './reset-pass/reset-pass'
import ForgotPass from './forgot-pass/forgot-pass'
import UnitWizard from './unit-wizard/unit-wizard'
import UnitExplorer from './unit-explorer/unit-explorer'
import NotificationSettings from './notification-settings/notification-settings'
import Unit from './unit/unit'
import ReportWizard from './report-wizard/report-wizard'
import SideMenu from './side-menu/side-menu'
import ErrorDialog from './dialogs/error-dialog'
import ResetLinkSuccessDialog from './dialogs/reset-link-success-dialog'
import { checkPassReset } from './app.actions'
import { genericErrorCleared } from './general-actions'

class App extends Component {
  componentWillMount () {
    this.props.dispatch(checkPassReset())
  }

  render () {
    const { userLoggedIn, errors, dispatch } = this.props
    const firstError = errors.length ? errors[0] : ''
    return (
      <div className='roboto'>
        {userLoggedIn ? (
          <div>
            <Switch>
              <Route exact path='/unit/new' component={UnitWizard} />
              <Route path='/unit/:unitId' component={Unit} />
              <Route exact path='/unit' component={UnitExplorer} />
              <Route exact path='/dashboard' component={Dashboard} />
              <Route exact path='/invitation' component={InvitationLogin} />
              <Route exact path='/notification-settings' component={NotificationSettings} />
`             <Route path='/report/:reportId/:viewMode' component={ReportWizard} />
              <Route exact path='/case/new' component={CaseWizard} />
              <Route path='/case' component={CaseMaster} />
              <Redirect to='/case' />
            </Switch>
            <SideMenu />
            <ErrorDialog
              show={!!firstError}
              text={firstError}
              onDismissed={() => dispatch(genericErrorCleared(0))}
            />
          </div>
        ) : (
          <div>
            <Switch>
              <Route exact path='/' component={LoginPage} />
              <Route exact path='/signup' component={SignupPage} />
              <Route exact path='/invitation' component={InvitationLogin} />
              <Route exact path='/forgot-pass' component={ForgotPass} />
              <Route exact path='/reset-pass' component={ResetPass} />
              <Redirect to='/' />
            </Switch>
            <ResetLinkSuccessDialog />
          </div>
        )}
      </div>
    )
  }
}

App.propTypes = {
  userLoggedIn: PropTypes.bool,
  errors: PropTypes.array.isRequired
}

// export default App
export default withRouter(connect(
  ({ genericErrorState }) => ({errors: genericErrorState}) // map redux state to props
)(createContainer(() => ({ // map meteor state to props
  userLoggedIn: !!Meteor.userId()
}), App)))
