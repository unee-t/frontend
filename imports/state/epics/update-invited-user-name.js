import { Meteor } from 'meteor/meteor'
import { of } from 'rxjs/observable/of'
import { UPDATE_INVITED_USER_NAME, clearWelcomeMessage } from '../../ui/case/case.actions'

import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/mergeMap'

export const updateUserName = action$ =>
  action$.ofType(UPDATE_INVITED_USER_NAME)
    .filter(() => !!Meteor.userId()) // fail safe, but shouldn't happen
    .mergeMap(({ name }) => {
      Meteor.call('users.updateMyName', name)
      return of(clearWelcomeMessage())
    })
