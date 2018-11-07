import { Accounts } from 'meteor/accounts-base'
import { merge } from 'rxjs/observable/merge'
import { of } from 'rxjs/observable/of'
import { empty } from 'rxjs/observable/empty'
import { push } from 'react-router-redux'

import { CHECK_PASS_RESET, PASS_RESET_REQUESTED } from '../../ui/app.actions'

import 'rxjs/add/operator/switchMap'
import 'rxjs/add/operator/delay'

let params

// This must be on top-level code, it won't work otherwise
Accounts.onResetPasswordLink((token, done) => {
  params = {
    token,
    done
  }
})

export const checkPassReset = action$ => action$
  .ofType(CHECK_PASS_RESET)
  .switchMap(() => {
    if (params) {
      return merge(
        of(Object.assign({ type: PASS_RESET_REQUESTED }, params)),
        of(push('/reset-pass'))
      )
    } else {
      return empty()
    }
  })
