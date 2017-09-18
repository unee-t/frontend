import { Meteor } from 'meteor/meteor'
import React from 'react'
import { render } from 'react-dom'
import { Routes } from '../imports/ui/routes.jsx'
import { ConnectedRouter } from 'react-router-redux'

import '../imports/startup/accounts-config.js'

import { Provider } from 'react-redux'
import { Store, history } from '../imports/state/store'

Meteor.startup(() => render((
  <Provider store={Store}>
    <ConnectedRouter history={history}>
      <Routes />
    </ConnectedRouter>
  </Provider>
), document.querySelector('#app')))
