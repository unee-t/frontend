import userApiKey from '../middleware/user-api-key-middleware'
import bugzillaApi from '../../../util/bugzilla-api'
import { logger } from '../../../util/logger'
import {
  associatedCasesQueryExps,
  caseBzApiRoute,
  caseQueryBuilder,
  noReportsExp,
  openOnlyExp
} from '../../cases'
import UnitMetaData from '../../unit-meta-data'
import { caseAPIFields, makeUserAPIObjGenerator, tranformCaseAPIObj } from './common'

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
    caseAPIFields
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

  const productGroupDict = bugs.reduce((all, bug) => {
    all[bug.product] = all[bug.product] || []
    all[bug.product].push(bug)
    return all
  }, {})

  const unitsMeta = UnitMetaData.find({
    bzName: {
      $in: Object.keys(productGroupDict)
    },
    ownerIds: apiKeyDetails.generatedBy
  })

  let unitDataGroups = []
  unitsMeta.forEach(unitMeta => {
    const generateUserObj = makeUserAPIObjGenerator(unitMeta._id)

    const cases = productGroupDict[unitMeta.bzName].map(bug => {
      return tranformCaseAPIObj(bug, user, generateUserObj)
    })
    unitDataGroups.push({
      unitId: unitMeta._id,
      name: unitMeta.displayName || unitMeta.bzName,
      cases
    })
  })

  res.send(200, unitDataGroups)
})
