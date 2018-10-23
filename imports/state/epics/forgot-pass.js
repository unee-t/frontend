import { Meteor } from 'meteor/meteor'
import { Subject } from 'rxjs/Subject'
import { push } from 'react-router-redux'
import { merge } from 'rxjs/observable/merge'
import { of } from 'rxjs/observable/of'

import { FORGOT_PASS, error, success, resetError, forgotPassProcess } from '../../ui/forgot-pass/forgot-pass.actions'

import 'rxjs/add/operator/switchMap'
import 'rxjs/add/operator/filter'

export const forgotPass = action$ =>
  action$.ofType(FORGOT_PASS)
    .filter(() => !Meteor.userId())
    .switchMap(({email}) => {
      const meteorResult$ = new Subject()
      Meteor.call('users.forgotPass', email, err => {
        if (err) {
          meteorResult$.next(error(err.error))
        } else {
          meteorResult$.next(resetError())
          meteorResult$.next(success(email))
          meteorResult$.next(push('/'))
        }
        meteorResult$.complete()
      })
      return merge(
        of(forgotPassProcess()),
        meteorResult$
      )
    })
