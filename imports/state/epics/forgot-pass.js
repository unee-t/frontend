import { Accounts } from 'meteor/accounts-base'
import { Meteor } from 'meteor/meteor'
import { Subject } from 'rxjs/Subject'
import { push } from 'react-router-redux'

import { FORGOT_PASS, ERROR, SUCCESS, RESET_ERROR } from '../../ui/forgot-pass/forgot-pass.actions'

import 'rxjs/add/operator/switchMap'
import 'rxjs/add/operator/filter'

export const forgotPass = action$ =>
  action$.ofType(FORGOT_PASS)
    .filter(() => !Meteor.userId())
    .switchMap(({email}) => {
      const meteorResult$ = new Subject()
      Accounts.forgotPassword({email}, err => {
        if (err) {
          meteorResult$.next({
            type: ERROR,
            error: err.reason
          })
        } else {
          meteorResult$.next({
            type: RESET_ERROR
          })
          meteorResult$.next({
            type: SUCCESS,
            email
          })
          meteorResult$.next(push('/'))
        }
        meteorResult$.complete()
      })
      return meteorResult$
    })
