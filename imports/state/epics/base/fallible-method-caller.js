import { Meteor } from 'meteor/meteor'
import { filter, take, mergeMap, map } from 'rxjs/operators'
import { Subject } from 'rxjs/Subject'
import { merge } from 'rxjs/observable/merge'
import { of } from 'rxjs/observable/of'

/**
 * This is a template for the most common type of epics we use at Unee-T.
 * It handles the "Init" => "Error"/"Success" states flow
 * @param actionType The type of action which triggers this epic
 * @param methodName The meteor method name which is called by this epic
 * @param argTranslator A function that receives the input action and translates it into an array of args for the method
 * @param initGen A function that generates an action object on init (optional)
 * @param errorGen A function that generates an action object on error (optional)
 * @param successGen A function that generates an action object on success (optional)
 * @returns {function(*): *} An epic handler function
 */
export default function fallibleMethodCaller (
  { actionType, methodName, argTranslator, actionGenerators: { initGen, errorGen, successGen } }
) {
  return action$ => action$
    .ofType(actionType)
    .pipe(
      filter(() => !!Meteor.userId()),
      mergeMap(inputAction => {
        const meteorResult$ = (new Subject())
          .pipe(
            take(1),
            map(error => {
              if (error) {
                return errorGen ? errorGen(error, inputAction) : {type: 'noopt'}
              }
              return successGen ? successGen(inputAction) : {type: 'noopt'}
            })
          )
        Meteor.call(methodName, ...argTranslator(inputAction), error => meteorResult$.next(error))
        if (initGen) {
          return merge(
            of(initGen(inputAction)),
            meteorResult$
          )
        } else {
          return meteorResult$
        }
      })
    )
}
