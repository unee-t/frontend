import { Meteor } from 'meteor/meteor'
import { INVITE_USER } from '../../ui/case/case.actions'

import 'rxjs/add/operator/do'
import 'rxjs/add/operator/ignoreElements'

export const inviteUser = action$ =>
  action$.ofType(INVITE_USER)
    .do(({userEmail, caseId}) => Meteor.call('cases.addParticipant', userEmail, parseInt(caseId)))
    .ignoreElements()
