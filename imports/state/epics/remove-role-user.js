import { Meteor } from 'meteor/meteor'
import { REMOVE_ROLE_USER, ROLE_USERS_STATE_ERROR, ROLE_USERS_REMOVED } from '../../ui/case/case.actions'
import { Subject } from 'rxjs/Subject'

import 'rxjs/add/operator/do'
import 'rxjs/add/operator/ignoreElements'

export const removeRoleUser = action$ =>
  action$.ofType(REMOVE_ROLE_USER)
    .filter(() => !!Meteor.userId()) // fail safe, but shouldn't happen
    .mergeMap(({userBzLogin, caseId}) => {
      const meteorResult$ = new Subject()
      const userLogins = [userBzLogin]
      Meteor.call('cases.toggleParticipants', userLogins, parseInt(caseId), false, err => {
        if (err) {
          meteorResult$.next({
            type: ROLE_USERS_STATE_ERROR,
            error: err,
            users: userLogins,
            caseId
          })
        } else {
          meteorResult$.next({
            type: ROLE_USERS_REMOVED,
            removed: userLogins,
            caseId
          })
        }
        meteorResult$.complete()
      })

      return meteorResult$
    })
