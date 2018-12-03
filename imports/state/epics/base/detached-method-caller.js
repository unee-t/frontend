// @flow
import { Meteor } from 'meteor/meteor'

import { filter, tap, ignoreElements } from 'rxjs/operators'
import { Observable } from 'rxjs/Observable'

export interface BaseAction {
  type: string
}
type Options<T> = { actionType: string, methodName: string, argTranslator: (action: T) => Array<any> }

export const detachedMethodCaller = <T: BaseAction>({ actionType, methodName, argTranslator }: Options<T>) =>
  (action$: Observable) => action$.ofType(actionType)
    .pipe(
      filter(() => !!Meteor.userId()), // fail safe, but shouldn't happen
      tap((action: T) => Meteor.call(methodName, ...argTranslator(action))),
      ignoreElements()
    )
