// import { Accounts } from 'meteor/accounts-base'
import { Meteor } from 'meteor/meteor'
import { Subject } from 'rxjs/Subject'
import { RESEND_VERIFICATION, RESEND_SUCCESS } from '../../ui/components/unverified-warning.actions'
import { genericErrorOccurred } from '../../ui/general-actions'

import 'rxjs/add/operator/switchMap'
import 'rxjs/add/operator/filter'

export const unverifiedWarning = (action$, store) =>
  action$.ofType(RESEND_VERIFICATION)
    // .filter(() => store.getState().resendVerificationState)
    .switchMap(() => {
      const meteorResult$ = new Subject()
      Meteor.call('resendEmail', (err, result) => {
        if (err) {
          meteorResult$.next(
            genericErrorOccurred(`Failed to resend verification email due to: "${err.error}"`)
          )
        } else {
          meteorResult$.next({
            type: RESEND_SUCCESS
          })
        }
        meteorResult$.complete()
      })
      return meteorResult$
    })
