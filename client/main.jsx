import { Meteor } from 'meteor/meteor'
import React from 'react'
import { render } from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { Routes } from '../imports/ui/routes.jsx'

import '../imports/startup/accounts-config.js'

import { Provider } from 'react-redux'
import Store from '../imports/state/store'

Meteor.startup(() => render((
  <Provider store={Store}>
    <BrowserRouter>
      <Routes />
    </BrowserRouter>
  </Provider>
), document.querySelector('#app')))
