// @flow
import { Meteor } from 'meteor/meteor'
import userApiKey, {
  headerExtractor,
  makeComposedExtractor,
  queryExtractor
} from '../middleware/user-api-key-middleware'
import { idUrlTemplate } from '../../cases'
import { factoryOptions as commentFactoryOptions } from '../../comments'
import { callAPI } from '../../../util/bugzilla-api'
import { logger } from '../../../util/logger'
import { caseAPIFields, makeUserAPIObjGenerator, tranformCaseAPIObj } from './common'
import UnitMetaData from '../../unit-meta-data'
import { attachmentTextMatcher, floorPlanTextMatcher } from '../../../util/matchers'

import type { Request, Response } from '../rest-types'

export default userApiKey((req: Request, res: Response) => {
  const { user, params } = req
  const { apiKey } = user.bugzillaCreds

  // Getting the case's data
  let bugFields
  try {
    const caseResp = callAPI('get', idUrlTemplate(params.id), { api_key: apiKey }, false, true)
    const bugItem = caseResp.data.bugs[0]
    if (!bugItem) {
      res.send(404, `No accessible case with id ${params.id} was found for this user`)
      return
    }
    bugFields = caseAPIFields.reduce((item, field) => {
      item[field] = bugItem[field]
      return item
    }, {})
  } catch (e) {
    logger.error(`Failed to fetch case ${params.id} from BZ API for user ${user._id} reason: ${e.message}`)
    res.send(500, e.message)
    return
  }

  const unitMeta = UnitMetaData.findOne({ bzName: bugFields.product })
  if (!unitMeta) {
    logger.error(`No unit meta data found for product name ${bugFields.product} for case ${params.id} requested by user ${user._id}`)
    res.send(500, `No unit meta data found for this case's product ${bugFields.product}`)
    return
  }
  const userTransformer = makeUserAPIObjGenerator(unitMeta._id)
  const caseItem = tranformCaseAPIObj(bugFields, user, userTransformer)

  caseItem.unitId = unitMeta._id
  caseItem.unitName = unitMeta.displayName

  // Getting the comments' data
  let commentList
  try {
    const commentsResp = callAPI('get', `/rest/bug/${params.id}/comment`, { api_key: apiKey }, false, true)
    commentList = commentFactoryOptions.dataResolver(commentsResp.data, params.id).map(comment => {
      const { creator, id, count, creation_time: time, text } = comment
      const commentType = attachmentTextMatcher(text)
      const commentBody:any = {
        creator: userTransformer(Meteor.users.findOne({ 'bugzillaCreds.login': creator })),
        id,
        count,
        time
      }
      if (commentType) {
        commentBody.type = commentType
        commentBody[commentType + 'Url'] = text.split('\n')[1]
      } else {
        const floorPlanDetails = floorPlanTextMatcher(text)
        if (floorPlanDetails) {
          commentBody.type = 'floorPlan'
          commentBody.floorPlanId = floorPlanDetails.id
          const floorPlan = unitMeta.floorPlanUrls.find(f => f.id === floorPlanDetails.id)
          commentBody.imageUrl = floorPlan ? floorPlan.url : 'N/A'
          commentBody.pins = floorPlanDetails.pins
        } else {
          commentBody.type = 'text'
          commentBody.text = text
        }
      }
      return commentBody
    })
  } catch (e) {
    logger.error(`Failed to fetch comments for case ${params.id} from BZ API for user ${user._id} reason: ${e.message}`)
    res.send(500, e.message)
    return
  }
  caseItem.details = commentList[0].text
  res.send(200, {
    ...caseItem,
    comments: commentList
  })
}, makeComposedExtractor(queryExtractor, headerExtractor))
