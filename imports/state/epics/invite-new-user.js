import { Meteor } from 'meteor/meteor'
import { Subject } from 'rxjs/Subject'
import { merge } from 'rxjs/observable/merge'
import { of } from 'rxjs/observable/of'
import { INVITE_NEW_USER, ASSIGN_NEW_USER, INVITATION_SUCCESS, INVITATION_INITIATED, INVITATION_ERROR } from '../../ui/case/case.actions'
import { TYPE_CC, TYPE_ASSIGNED, collectionName } from '../../api/pending-invitations'

import 'rxjs/add/operator/take'
import 'rxjs/add/operator/mergeMap'

export const inviteNewUser = action$ =>
  action$
    .filter(action => [INVITE_NEW_USER, ASSIGN_NEW_USER].includes(action.type))
    .filter(() => !!Meteor.userId()) // fail safe, but shouldn't happen
    .mergeMap(({type, email, role, isOccupant, caseId, unitId}) => {
      const meteorResult$ = (new Subject())
        .take(1)
        .map((error) => ({
          type: error ? INVITATION_ERROR : INVITATION_SUCCESS,
          email,
          caseId,
          errorText: error && error.error
        }))
      const invitationType = type === INVITE_NEW_USER ? TYPE_CC : TYPE_ASSIGNED
      Meteor.call(
        `${collectionName}.inviteNewUser`, email, role, isOccupant, parseInt(caseId), parseInt(unitId), invitationType,
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
