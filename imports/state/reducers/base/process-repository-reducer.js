// @flow

type Options = {
  +startAction: string,
  +errorAction: string,
  +successAction: string,
  +clearAction: string,
  +fieldNames: Array<string>
}

type Action = {
  type: string,
  error?: any
}

type State = Array<{
  completed?: boolean,
  pending?: boolean
}>

export default function ({ startAction, errorAction, successAction, clearAction, fieldNames }: Options) {
  const actionTypes = [startAction, errorAction, successAction, clearAction]
  const processMatcher = action => obj => fieldNames.every(field => obj[field] === action[field])
  return function (state: State = [], action: Action) {
    const { type, error, ...rest } = action
    if (actionTypes.includes(type)) {
      const newState:State = state.slice()
      const processIndex = state.findIndex(processMatcher(action))
      switch (type) {
        case startAction:
          const newProcess = { ...rest, pending: true }
          if (processIndex === -1) {
            newState.push(newProcess)
          } else {
            newState.splice(processIndex, 1, newProcess)
          }
          return newState
        case successAction:
          newState.splice(processIndex, 1, { ...rest, completed: true })
          return newState
        case errorAction:
          newState.splice(processIndex, 1, { ...rest, error })
          return newState
        case clearAction:
          newState.splice(processIndex, 1)
          return newState
      }
    }
    return state
  }
}
