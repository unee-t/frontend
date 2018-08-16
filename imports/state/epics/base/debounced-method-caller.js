import { Meteor } from 'meteor/meteor'
import { filter, debounceTime, distinctUntilChanged, tap, ignoreElements } from 'rxjs/operators'

export default function debouncedMethodCaller ({ actionType, methodName, argTranslator }) {
  return action$ => action$
    .ofType(actionType)
    .pipe(
      filter(() => !!Meteor.userId()),
      debounceTime(750),
      distinctUntilChanged(),
      tap(
        args => Meteor.call(methodName, ...argTranslator(args))
      ),
      ignoreElements()
    )
}
