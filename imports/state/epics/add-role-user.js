import { Meteor } from 'meteor/meteor'
import { ADD_ROLE_USER } from '../../ui/case/case.actions'

import 'rxjs/add/operator/do'
import 'rxjs/add/operator/ignoreElements'

export const addRoleUser = action$ =>
  action$.ofType(ADD_ROLE_USER)
    .do(({userEmail, caseId}) => Meteor.call('cases.addParticipant', userEmail, parseInt(caseId)))
    .ignoreElements()
