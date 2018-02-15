import { Meteor } from 'meteor/meteor'
import { Subject } from 'rxjs/Subject'
import { merge } from 'rxjs/observable/merge'
import { of } from 'rxjs/observable/of'
import { push } from 'react-router-redux'
import {
  FETCH_INVITATION_CREDENTIALS,
  LOADING_INVITATION_CREDENTIALS,
  ERROR_INVITATION_CREDENTIALS,
  LOGIN_INVITATION_CREDENTIALS,
  SUCCESS_INVITATION_CREDENTIALS
} from '../../ui/invitation-login/invitation-login.actions'

import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/switchMap'

export const fetchInvitationCredentials = action$ => action$
  .ofType(FETCH_INVITATION_CREDENTIALS)
  .filter(() => !Meteor.userId()) // fail safe, but shouldn't happen
  .switchMap(({code}) => {
    const meteorResult$ = new Subject()
    Meteor.call('users.invitationLogin', code, (error, {email, pw, caseId, invitedByDetails}) => {
      if (error) {
        meteorResult$.next({
          type: ERROR_INVITATION_CREDENTIALS,
          error
        })
        meteorResult$.complete()
        return
      }
      meteorResult$.next({
        type: LOGIN_INVITATION_CREDENTIALS
      })
      Meteor.loginWithPassword(email, pw, error => {
        if (error) {
          meteorResult$.next({
            type: ERROR_INVITATION_CREDENTIALS,
            error
          })
        } else {
          meteorResult$.next({
            type: SUCCESS_INVITATION_CREDENTIALS,
            showWelcomeMessage: !Meteor.user().profile.name,
            invitedByDetails
          })
          meteorResult$.next(push(`/case/${caseId}`))
        }
        meteorResult$.complete()
      })
    })
    return merge(
      of({
        type: LOADING_INVITATION_CREDENTIALS
      }),
      meteorResult$
    )
  })
