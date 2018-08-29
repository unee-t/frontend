import { Accounts } from 'meteor/accounts-base'
import { Meteor } from 'meteor/meteor'
import { Subject } from 'rxjs/Subject'
import { RESEND_VERIFICATION, ERROR, SUCCESS } from '../../ui/unverified-warning/unverified-warning.actions'

import 'rxjs/add/operator/switchMap'
import 'rxjs/add/operator/filter'

export const resendVerification = action$ =>
  action$.ofType(RESEND_VERIFICATION)
    .filter(() => !Meteor.userId())
    .switchMap(({userId}) => {
      const meteorResult$ = new Subject()
      Accounts.sendVerificationEmail({userId}, err => {
        if (err) {
          meteorResult$.next({
            type: ERROR,
            error: err.reason
          })
        } else {
          meteorResult$.next({
            type: SUCCESS
          })
        }
        meteorResult$.complete()
      })
      return meteorResult$
    })
