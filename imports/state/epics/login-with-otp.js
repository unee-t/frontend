// @flow

import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import { switchMap, filter, catchError } from 'rxjs/operators'
import { of } from 'rxjs/observable/of'
import { _throw } from 'rxjs/observable/throw'
import { merge } from 'rxjs/observable/merge'
import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import { LOGIN_WITH_OTP } from '../../ui/app.actions'
import { genericErrorOccurred } from '../../ui/general-actions'

export const loginWithOtp = (action$:Observable) => {
  const typeFilter = action$.ofType(LOGIN_WITH_OTP)

  const loginSteps = [
    switchMap(({ userId, otpToken }) => {
      const meteorLogin$ = (new Subject())
        .pipe(
          switchMap(e => {
            if (e) {
              return _throw(`Error while logging in with OTP: ${e.message}`)
            } else {
              return of({ type: 'noopt' })
            }
          })
        )
      Accounts.callLoginMethod({
        methodArguments: [{
          userId,
          otpToken
        }],
        userCallback: e => meteorLogin$.next(e)
      })

      return meteorLogin$
    }),
    catchError(msg => of(genericErrorOccurred(msg)))
  ]
  const processLogin = typeFilter.pipe(
    filter(() => !Meteor.userId()),
    ...loginSteps
  )

  const processLogout = typeFilter.pipe(
    filter(() => Meteor.userId()),
    switchMap(action => {
      const meteorLogout$ = (new Subject())
        .pipe(
          switchMap(e => {
            if (e) {
              return _throw(`Error occurred while logging out before OTP usage: ${e.message}`)
            } else {
              return of(action)
            }
          })
        )
      Meteor.logout(e => meteorLogout$.next(e))

      return meteorLogout$
    }),
    ...loginSteps
  )

  return merge(processLogin, processLogout)
}
