import { Meteor } from 'meteor/meteor'
import { LOGOUT_USER } from '../../ui/general-actions'

import 'rxjs/add/operator/do'
import 'rxjs/add/operator/ignoreElements'

export const logoutUser = action$ =>
  action$.ofType(LOGOUT_USER)
    .filter(() => !!Meteor.userId()) // fail safe, but shouldn't happen
    .do(({ text, caseId }) => Meteor.logout())
    .ignoreElements()
