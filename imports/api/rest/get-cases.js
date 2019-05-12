import { Meteor } from 'meteor/meteor'
import userApiKey from './middleware/user-api-key-middleware'
import bugzillaApi from '../../util/bugzilla-api'
import { logger } from '../../util/logger'
import {
  associatedCasesQueryExps,
  caseBzApiRoute,
  caseQueryBuilder,
  noReportsExp,
  openOnlyExp,
  transformCaseForClient
} from '../cases'
import UnitMetaData from '../unit-meta-data'

export default userApiKey((req, res) => {
  const { user, apiKeyDetails } = req

  const { login: userIdentifier, apiKey: bzApiKey } = user.bugzillaCreds
  const queryExpressions = [
    noReportsExp,
    openOnlyExp,
    ...associatedCasesQueryExps(userIdentifier)
  ]
  const queryPayload = caseQueryBuilder(
    queryExpressions,
    [
      'product',
      'summary',
      'id',
      'assigned_to',
      'creation_time',
      'cf_ipi_clust_1_next_step',
      'description',
      'cf_ipi_clust_1_solution',
      'deadline',
      'cc',
      'rep_platform',
      'cf_ipi_clust_6_claim_type',
      'creator'
    ]
  )

  let bugs
  try {
    const jsonResponse = bugzillaApi.callAPI('get', caseBzApiRoute, { api_key: bzApiKey, ...queryPayload }, false, true)
    bugs = jsonResponse.data.bugs
  } catch (e) {
    logger.error(`Failed to fetch open cases from BZ API for user ${user._id} reason: ${e.message}`)
    res.send(500, e.message)
    return
  }

  const unitGroupDict = bugs.reduce((all, bug) => {
    all[bug.product] = all[bug.product] || []

    const {
      product,
      assigned_to: assignedTo,
      assigned_to_detail: a,
      cc,
      cc_detail: b,
      creator,
      creator_detail: c,
      creation_time: creationTime,
      ...relevantBugFields
    } = bug
    const assigneeUser = Meteor.users.findOne({ 'bugzillaCreds.login': assignedTo })
    const assigneeId = assigneeUser ? assigneeUser._id : null
    const creatorUser = Meteor.users.findOne({ 'bugzillaCreds.login': creator })
    const creatorId = creatorUser ? creatorUser._id : null
    const involvedIdList = cc.map(ccItem => {
      const ccUser = Meteor.users.findOne({ 'bugzillaCreds.login': ccItem })
      return ccUser ? ccUser._id : null
    })
    const caseItem = {
      assigneeId,
      creatorId,
      involvedIdList,
      creationTime,
      ...transformCaseForClient(relevantBugFields)
    }
    all[bug.product].push(caseItem)
    return all
  }, {})

  const unitsMeta = UnitMetaData.find({
    bzName: {
      $in: Object.keys(unitGroupDict)
    },
    ownerIds: apiKeyDetails.generatedBy
  })

  let unitDataGroups = []
  unitsMeta.forEach(unitMeta => {
    unitDataGroups.push({
      _id: unitMeta._id,
      name: unitMeta.displayName || unitMeta.bzName,
      cases: unitGroupDict[unitMeta.bzName]
    })
  })

  res.send(200, unitDataGroups)
})
