import { Meteor } from 'meteor/meteor'
import { Subject } from 'rxjs/Subject'
import { merge } from 'rxjs/observable/merge'
import { of } from 'rxjs/observable/of'
import { INVITE_NEW_USER, INVITATION_SUCCESS, INVITATION_INITIATED, INVITATION_ERROR } from '../../ui/case/case.actions'
import { TYPE_CC, collectionName } from '../../api/pending-invitations'

import 'rxjs/add/operator/take'

export const inviteNewUser = action$ =>
  action$.ofType(INVITE_NEW_USER)
    .mergeMap(({email, role, isOccupant, caseId, unitId}) => {
      const meteorResult$ = (new Subject())
        .take(1)
        .map((error) => ({
          type: error ? INVITATION_ERROR : INVITATION_SUCCESS,
          email,
          caseId,
          errorText: error && error.error
        }))
      Meteor.call(
        `${collectionName}.inviteNewUser`, email, role, isOccupant, parseInt(caseId), parseInt(unitId), TYPE_CC,
        error => {
          if (error) {
            console.error('User invitation error', error)
          }
          meteorResult$.next(error)
        }
      )
      return merge(
        of({
          type: INVITATION_INITIATED,
          email,
          caseId
        }),
        meteorResult$
      )
    })
