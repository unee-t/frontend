// @flow

import * as React from 'react'
import { Route, Switch, Redirect, withRouter } from 'react-router-dom'
import { Meteor } from 'meteor/meteor'
import { connect } from 'react-redux'
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
import ReportExplorer from './report-explorer/report-explorer'
import ReportSignage from './report-signage/report-signage'
import ReportShare from './report-share/report-share'
import ReportAttachment from './report-attachment/report-attachment'
import NotificationSettings from './notification-settings/notification-settings'
import AccountSettings from './account-settings/account-settings'
import Unit from './unit/unit'
import ReportWizard from './report-wizard/report-wizard'
import ReportPreview from './report-preview/report-preview'
import SideMenu from './side-menu/side-menu'
import ErrorDialog from './dialogs/error-dialog'
import ResetLinkSuccessDialog from './dialogs/reset-link-success-dialog'
import { checkPassReset, loginWithOtp } from './app.actions'
import { genericErrorCleared } from './general-actions'
import { BrowserSupportMsg } from './login/browser-support-msg'
import { parseQueryString } from '../util/parsers'
import Preloader from './preloader/preloader'
import { replace } from 'react-router-redux'

type Props = {
  userLoggedIn: boolean,
  errors: Array<Error>,
  loginPending: boolean,
  dispatch: (action: any) => void,
  location: {
    pathname: string
  },
  autoLoginParams: ?{
    userId: string,
    otp: string
  }
}

class App extends React.Component<Props> {
  componentWillMount () {
    this.props.dispatch(checkPassReset())
  }

  componentDidMount () {
    const { loginPending, autoLoginParams, dispatch, location } = this.props
    if (loginPending && autoLoginParams) {
      const { userId, otp } = autoLoginParams
      dispatch(loginWithOtp(userId, otp))
    } else if (autoLoginParams) {
      dispatch(replace(location.pathname))
    }
  }

  componentWillUpdate (nextProps) {
    const { loginPending, autoLoginParams, location, dispatch, errors } = nextProps
    if ((!loginPending || errors.length < this.props.errors.length) && autoLoginParams) {
      dispatch(replace(location.pathname))
    }
  }

  render () {
    const { userLoggedIn, errors, dispatch, loginPending } = this.props
    const firstError = errors.length ? errors[0] : ''
    var isIE = /*
    @cc_on!@
    */false || !!document.documentMode
    if (isIE) {
      return <BrowserSupportMsg />
    }
    if (loginPending) {
      return (
        <div>
          <Preloader />
          <ErrorDialog
            show={!!firstError}
            text={firstError}
            onDismissed={() => dispatch(genericErrorCleared(0))}
          />
        </div>
      )
    }
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
              <Route exact path='/account-settings' component={AccountSettings} />
              <Route exact path='/report/:reportId/preview' component={ReportPreview} />
              <Route path='/report/:reportId/sign' component={ReportSignage} />
              <Route path='/report/:reportId/draft' component={ReportWizard} />
              <Route path='/report/:reportId/attachment/:attachmentId' component={ReportAttachment} />
              <Route exact path='/report/:reportId/share' component={ReportShare} />
              <Route path='/report' component={ReportExplorer} />
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

// export default App
export default withRouter(connect(
  ({ genericErrorState }) => ({ errors: genericErrorState }) // map redux state to props
)(createContainer(props => {
  const { userId, otp } = parseQueryString(props.location.search)

  const autoLoginNeeded = !!(userId && otp)
  return { // map meteor state to props
    userLoggedIn: !!Meteor.userId(),
    loginPending: autoLoginNeeded && Meteor.userId() !== userId,
    autoLoginParams: autoLoginNeeded ? {
      userId,
      otp
    } : null
  }
}, App)))
