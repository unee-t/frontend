import { Accounts } from 'meteor/accounts-base'
import { Subject } from 'rxjs/Subject'
import { push } from 'react-router-redux'

import { RESET_PASS, RESET_PASS_COMPLETE, RESET_PASS_ERROR } from '../../ui/reset-pass/reset-pass.actions'

import 'rxjs/add/operator/switchMap'
import 'rxjs/add/operator/filter'

export const resetPass = (action$, store) => action$
  .ofType(RESET_PASS)
  .filter(() => store.getState().passResetState.isRequested) // Fail safe
  .switchMap(({ newPass }) => {
    const { token, done } = store.getState().passResetState
    const subject$ = new Subject()
    Accounts.resetPassword(token, newPass, err => {
      if (err) {
        subject$.next({
          type: RESET_PASS_ERROR,
          error: err.reason
        })
        setTimeout(() => {
          done()
          subject$.next(push('/'))
        }, 2000)
      } else {
        subject$.next({
          type: RESET_PASS_COMPLETE
        })
        done()
      }
    })

    return subject$
  })
