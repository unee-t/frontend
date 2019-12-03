// @flow
import type { Request, Response } from './rest-types'
import { logger } from '../../util/logger'
import { publicationObj, FailedComments } from '../comments'
import { callAPI } from '../../util/bugzilla-api'
import userApiKey, { bodyExtractor, headerExtractor, makeComposedExtractor } from './middleware/user-api-key-middleware'

type ErrorObj = {
  message: string
}

export default userApiKey((req: Request, res: Response) => {
  function handleBZApiError (errContents: ErrorObj) {
    logger.error({
      user: user._id,
      method: `POST /api/cases/:caseId/comments`,
      args: [body.text, params.caseId],
      error: errContents
    })
    FailedComments.insert({
      error: errContents,
      comment: body.text,
      creator: user.bugzillaCreds.login,
      creation_time: (new Date()).toISOString(),
      bug_id: caseId
    })
    res.send(500, `API Error: ${errContents.message}`)
  }
  const { user, params, body } = req
  const caseId = parseInt(params.caseId)

  const payload = {
    comment: body.text,
    api_key: user.bugzillaCreds.apiKey
  }

  logger.info(`${user.bugzillaCreds.login} is commenting "${body.text}" on case ${caseId} via post comment API`)

  let createData
  try {
    // Creating the comment
    createData = callAPI('post', `/rest/bug/${caseId}/comment`, payload, false, true)
    if (createData.data.error) {
      handleBZApiError({ message: createData.data.error })
    } else {
      res.send(201, { id: createData.data.id })
    }
  } catch (e) {
    return handleBZApiError(e.response.data)
  }
  try {
    // Fetching the full comment object by the returned id from the creation operation
    const commentData = callAPI(
      'get', `/rest/bug/comment/${createData.data.id}`, { api_key: user.bugzillaCreds.apiKey }, false, true
    )

    // Digging the new comment object out of the response
    const newComment = commentData.data.comments[createData.data.id.toString()]
    publicationObj.handleAdded(newComment)
  } catch (e) {
    logger.warn('Live comment update failed due to "' + e.message + '". Proceeding with no error')
  }
}, makeComposedExtractor(bodyExtractor, headerExtractor))
