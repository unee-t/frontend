// @flow
import {
  REMOVE_STARTED,
  REMOVE_SUCCESS,
  REMOVE_ERROR,
  REMOVE_CLEARED
} from '../actions/unit-invite.actions'

import ProcessRepositoryReducer from './base/process-repository-reducer'

export default ProcessRepositoryReducer({
  startAction: REMOVE_STARTED,
  successAction: REMOVE_SUCCESS,
  errorAction: REMOVE_ERROR,
  clearAction: REMOVE_CLEARED,
  fieldNames: ['userEmail', 'unitBzId']
})
