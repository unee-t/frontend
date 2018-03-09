import { Meteor } from 'meteor/meteor'
import { filter, debounceTime, distinctUntilChanged, tap, ignoreElements } from 'rxjs/operators'

import { EDIT_CASE_FIELD } from '../../ui/case/case.actions'
import { collectionName } from '../../api/cases'

export const editCaseField = action$ => action$
  .ofType(EDIT_CASE_FIELD)
  .pipe(
    filter(() => !!Meteor.userId()),
    debounceTime(750),
    distinctUntilChanged(),
    tap(
      ({fieldName, newValue, caseId}) => Meteor.call(`${collectionName}.editCaseField`, parseInt(caseId), fieldName, newValue)
    ),
    ignoreElements()
  )
