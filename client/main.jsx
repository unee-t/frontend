import { Meteor } from 'meteor/meteor'
import { Tracker } from 'meteor/tracker'
import React from 'react'
import { render } from 'react-dom'
import App from '../imports/ui/app.jsx'
import { ConnectedRouter } from 'react-router-redux'
import { Accounts } from 'meteor/accounts-base'

import { Provider } from 'react-redux'
import { Store, history } from '../imports/state/store'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import theme from '../imports/mui-theme/unee-t-theme'

Meteor.startup(() => {
  if (history.length === 1) {
    const currLocation = history.location
    console.log('Injecting base route to new tab')
    history.replace('/')
    history.push(currLocation.pathname + currLocation.search)
  }
  return render((
    <MuiThemeProvider muiTheme={theme}>
      <Provider store={Store}>
        <ConnectedRouter history={history}>
          <App />
        </ConnectedRouter>
      </Provider>
    </MuiThemeProvider>
  ), document.querySelector('#app'))
})

// This snippet is in charge of logging in an invited user for the first time, and assigning a temporary password
// NOTE: This has to be in top level code, before the startup callback is triggered
Accounts.onEnrollmentLink((token, done) => {
  const password = 'a' + Math.floor(0xffffff * Math.random()) + '!'
  Accounts.resetPassword(token, password, (err) => {
    // TODO: Make error appear in the UI
    if (err) return console.error(err)
    done()
    Tracker.autorun((cmp) => {
      const user = Meteor.user()
      if (user) {
        cmp.stop()
        if (user.profile.invitedToCase) {
          const {caseId} = user.profile.invitedToCase
          history.push(`/case/${caseId}`)
        }
      }
    })
  })
})
