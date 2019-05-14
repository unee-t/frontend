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
import UnitRolesData from '../unit-roles-data'

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
    const unitRolesDict = UnitRolesData.find({
      unitId: unitMeta._id
    }, {
      fields: {
        'members.id': 1,
        roleType: 1
      }
    }).fetch().reduce((all, role) => {
      role.members.forEach(member => {
        all[member._id] = role.roleType
      })
      return all
    }, {})
    const generateUserObj = userDoc => {
      const userObj = {}
      if (userDoc) {
        userObj._id = userDoc._id
        if (userDoc.profile.name) {
          userObj.name = userDoc.profile.name
        } else {
          userObj.emailPrefix = userDoc.emails[0].address.split('@')[0]
        }
        userObj.role = unitRolesDict[userDoc._id] || null
      }
      return userObj
    }

    const cases = productGroupDict[unitMeta.bzName].map(bug => {
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
      const userRelevance = []
      const assigneeObj = generateUserObj(Meteor.users.findOne({ 'bugzillaCreds.login': assignedTo }))
      if (user._id === assigneeObj._id) {
        userRelevance.push('Assignee')
      }

      const reporterObj = generateUserObj(Meteor.users.findOne({ 'bugzillaCreds.login': creator }))
      if (user._id === reporterObj._id) {
        userRelevance.push('Reporter')
      }

      const involvedIdList = cc.map(ccItem => generateUserObj(Meteor.users.findOne({ 'bugzillaCreds.login': ccItem })))
      if (involvedIdList.some(involved => involved._id === user._id)) {
        userRelevance.push('Invited To')
      }
      return {
        assignee: assigneeObj,
        reporter: reporterObj,
        involvedIdList,
        userRelevance,
        creationTime,
        ...transformCaseForClient(relevantBugFields)
      }
    })
    unitDataGroups.push({
      unitId: unitMeta._id,
      name: unitMeta.displayName || unitMeta.bzName,
      cases
    })
  })

  res.send(200, unitDataGroups)
})
