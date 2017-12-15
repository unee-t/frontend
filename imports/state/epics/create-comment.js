import { Meteor } from 'meteor/meteor'
import { CREATE_COMMENT } from '../../ui/case/case.actions'

import 'rxjs/add/operator/do'
import 'rxjs/add/operator/ignoreElements'

export const createComment = action$ =>
  action$.ofType(CREATE_COMMENT)
    .do(({text, caseId}) => Meteor.call('comments.insert', text, parseInt(caseId)))
    .ignoreElements()
