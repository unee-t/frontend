import { Meteor } from 'meteor/meteor'
import { collectionName } from '../../api/cases'
import { ASSIGN_EXISTING_USER } from '../../ui/case/case.actions'

import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/ignoreElements'

export const assignExistingUser = action$ =>
  action$.ofType(ASSIGN_EXISTING_USER)
    .filter(() => !!Meteor.userId()) // fail safe, but shouldn't happen
    .do(({ user, caseId }) => Meteor.call(`${collectionName}.changeAssignee`, user, parseInt(caseId)))
    .ignoreElements()
