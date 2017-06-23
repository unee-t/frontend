import React from 'react';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';

import App from '../imports/ui/app.jsx';
import '../imports/startup/accounts-config.js';

Meteor.startup(() => {
	render(<App />, document.getElementById('render-target'));
});