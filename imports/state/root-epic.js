import { combineEpics } from 'redux-observable'
import { createAttachment } from './epics/create-attachment'
import { createComment } from './epics/create-comment'

export const rootEpic = combineEpics(createAttachment, createComment)
