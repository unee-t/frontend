import { combineEpics } from 'redux-observable'
import { createAttachment } from './epics/create-attachment'
import { createComment } from './epics/create-comment'
import { retryAttachment } from './epics/retry-attachment'

export const rootEpic = combineEpics(createAttachment, retryAttachment, createComment)
