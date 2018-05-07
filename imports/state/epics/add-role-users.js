import { Meteor } from 'meteor/meteor'
import { ADD_ROLE_USERS, ROLE_USERS_ADDED, ROLE_USERS_STATE_ERROR } from '../../ui/case/case.actions'
import { Subject } from 'rxjs/Subject'
import { merge } from 'rxjs/observable/merge'
import { of } from 'rxjs/observable/of'

import 'rxjs/add/operator/mergeMap'

export const addRoleUsers = action$ =>
  action$.ofType(ADD_ROLE_USERS)
    .filter(() => !!Meteor.userId()) // fail safe, but shouldn't happen
    .mergeMap(({userLogins, caseId}) => {
      const meteorResult$ = new Subject()
      Meteor.call('cases.toggleParticipants', userLogins, parseInt(caseId), err => {
        if (err) {
          meteorResult$.next({
            type: ROLE_USERS_STATE_ERROR,
            error: err,
            users: userLogins,
            caseId
          })
        }
        meteorResult$.complete()
      })

      return merge(
        meteorResult$,
        of({
          type: ROLE_USERS_ADDED,
          users: userLogins,
          caseId
        })
      )
    })
