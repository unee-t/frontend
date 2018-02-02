import { Meteor } from 'meteor/meteor'
import { REMOVE_ROLE_USER } from '../../ui/case/case.actions'

import 'rxjs/add/operator/do'
import 'rxjs/add/operator/ignoreElements'

export const removeRoleUser = action$ =>
  action$.ofType(REMOVE_ROLE_USER)
    .do(({userEmail, caseId}) => Meteor.call('cases.toggleParticipant', userEmail, parseInt(caseId), false))
    .ignoreElements()
