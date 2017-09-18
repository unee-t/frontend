import { Meteor } from 'meteor/meteor'
import React from 'react'
import { render } from 'react-dom'
import App from '../imports/ui/app.jsx'
import { ConnectedRouter } from 'react-router-redux'

import '../imports/startup/accounts-config.js'

import { Provider } from 'react-redux'
import { Store, history } from '../imports/state/store'

Meteor.startup(() => render((
  <Provider store={Store}>
    <ConnectedRouter history={history}>
      <App />
    </ConnectedRouter>
  </Provider>
), document.querySelector('#app')))
