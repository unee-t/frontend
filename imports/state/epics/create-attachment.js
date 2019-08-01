// @flow
import {
  CREATE_ATTACHMENT,
  CREATE_COMMENT,
  ATTACHMENT_UPLOADING,
  ATTACHMENT_UPLOAD_PROGRESS,
  ATTACHMENT_UPLOAD_COMPLETED,
  ATTACHMENT_UPLOAD_ERROR
} from '../../ui/case/case.actions'
import { fileUploadProcessor } from './base/file-upload-processor'
import type { InputAction } from './base/file-upload-processor'

type CustAction = {
  ...InputAction,
  caseId: number,
  preview: string
}

export const createAttachment = fileUploadProcessor(CREATE_ATTACHMENT, {
  init: action => ({
    ...action,
    type: ATTACHMENT_UPLOADING
  }),
  progress: (action, percent) => ({
    ...action,
    type: ATTACHMENT_UPLOAD_PROGRESS,
    percent
  }),
  error: (action, error) => ({
    ...action,
    type: ATTACHMENT_UPLOAD_ERROR,
    errorMessage: 'Upload failed',
    error
  }),
  complete: (action, fileUrl) => {
    const custAction: CustAction = (action: any)

    const type = action.file.type.split('/')[0]

    return [
      {
        ...custAction,
        type: ATTACHMENT_UPLOAD_COMPLETED
      },
      {
        type: CREATE_COMMENT,
        text: `[!attachment(${type})]\n${fileUrl}`,
        caseId: custAction.caseId
      }
    ]
  }
})
