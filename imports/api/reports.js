import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check } from 'meteor/check'
import bugzillaApi from '../util/bugzilla-api'
import publicationFactory from './base/rest-resource-factory'
import { getUnitRoles } from './units'
import ReportSnapshots from './report-snapshots'
import {
  caseServerFieldMapping,
  REPORT_KEYWORD,
  idUrlTemplate,
  caseQueryBuilder,
  associatedCasesQueryExps,
  fieldEditMethodMaker,
  factoryOptions as caseFactoryOpts
} from './cases'

export const collectionName = 'reports'
const factoryOptions = {
  collectionName,
  dataResolver: caseFactoryOpts.dataResolver
}

export const REPORT_DRAFT_STATUS = 'UNCONFIRMED'
export const REPORT_FINAL_STATUS = 'CONFIRMED'

let publicationObj
if (Meteor.isServer) {
  publicationObj = publicationFactory(factoryOptions)
  Meteor.publish(`${collectionName}.byId`, publicationObj.publishById({
    uriTemplate: idUrlTemplate
  }))
  Meteor.publish(`${collectionName}.byUnitName`, publicationObj.publishByCustomQuery({
    uriTemplate: () => '/rest/bug',
    queryBuilder: (subHandle, unitName) => {
      if (!subHandle.userId) {
        return {}
      }
      const currUser = Meteor.users.findOne(subHandle.userId)
      const { login: userIdentifier } = currUser.bugzillaCreds
      return caseQueryBuilder(
        [
          {
            field: 'product',
            operator: 'equals',
            value: unitName
          },
          {
            field: 'keywords',
            operator: 'allwords',
            value: REPORT_KEYWORD
          },
          ...associatedCasesQueryExps(userIdentifier)
        ],
        [
          'product',
          'summary',
          'id',
          'status',
          'creation_time'
        ]
      )
    }
  }))
}

let Reports
if (Meteor.isClient) {
  Reports = new Mongo.Collection(collectionName)
}

Meteor.methods({
  [`${collectionName}.insert`] (params) {
    const { selectedUnit } = params
    check(params, {
      selectedUnit: String,
      title: String
    })
    if (!Meteor.userId()) {
      throw new Meteor.Error('not-authorized')
    }
    if (Meteor.isServer) {
      const { bugzillaCreds: { apiKey } } = Meteor.users.findOne(Meteor.userId())
      const { callAPI } = bugzillaApi

      let unitItem
      try {
        const requestUrl = `/rest/product?names=${encodeURIComponent(selectedUnit)}`
        const unitResult = callAPI('get', requestUrl, {api_key: apiKey}, false, true)
        unitItem = unitResult.data.products[0]
      } catch (e) {
        console.error(e)
        throw new Meteor.Error('API error')
      }
      const currUser = Meteor.user()

      // TODO: use UnitRolesData over this, and then this as a fallback
      const currUserRole = getUnitRoles(unitItem).find(role => role.login === currUser.bugzillaCreds.login)

      if (!currUserRole) {
        throw new Meteor.Error('not-authorized: The user must have a role in this unit')
      }

      console.log('Creating report', params)
      const normalizedParams = Object.keys(params).reduce((all, paramName) => {
        all[caseServerFieldMapping[paramName] || paramName] = params[paramName]
        return all
      }, {
        component: currUserRole.role,
        description: `Unee-T Inspection Report for the unit "${selectedUnit}"`,
        keywords: [REPORT_KEYWORD],
        status: 'UNCONFIRMED',
        api_key: apiKey,

        // Hardcoded values to avoid issues with BZ API "required" checks
        version: '---',
        op_sys: 'Unspecified', // NOTE: This might an actual value at a later evolution step of the app
        [caseServerFieldMapping.category]: '---',
        [caseServerFieldMapping.subCategory]: '---'
      })

      let newReportId
      try {
        const { data } = callAPI('post', '/rest/bug', normalizedParams, false, true)
        newReportId = data.id
        console.log(`a new report has been created by user ${Meteor.userId()}, report id: ${newReportId}`)
        // TODO: Add real time update handler usage
      } catch (e) {
        console.error({
          user: Meteor.userId(),
          method: `${collectionName}.insert`,
          args: [params],
          error: e
        })
        throw new Meteor.Error(`API Error: ${e.response.data.message}`)
      }
      return {newReportId}
    }
  },
  [`${collectionName}.finalize`] (reportId) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('not-authorized')
    }
    if (Meteor.isClient) {
      Reports.update({id: reportId}, {
        $set: {
          status: REPORT_FINAL_STATUS
        }
      })
    } else { // is server
      const {bugzillaCreds: {apiKey}} = Meteor.users.findOne(Meteor.userId())
      const {callAPI} = bugzillaApi
      const bugById = id => callAPI('get', `/rest/bug/${id}`, {api_key: apiKey}, false, true).data.bugs[0]

      let reportItem
      try {
        reportItem = bugById(reportId)
      } catch (e) {
        console.error({
          user: Meteor.userId(),
          method: `${collectionName}.finalize`,
          step: 'Fetch main report object (get /rest/bug/:reportId)',
          args: [reportId],
          error: e
        })
        throw new Meteor.Error('API error')
      }
      if (reportItem.status !== REPORT_DRAFT_STATUS) {
        throw new Meteor.Error(`A report can be finalized only from "${REPORT_DRAFT_STATUS}" status`)
      }
      const requestPayload = {
        [caseServerFieldMapping.status]: REPORT_FINAL_STATUS,
        api_key: apiKey
      }
      try {
        callAPI('put', `/rest/bug/${reportId}`, requestPayload, false, true)
      } catch (e) {
        console.error({
          user: Meteor.userId(),
          method: `${collectionName}.finalize`,
          step: 'Report status update (put /rest/bug/:reportId)',
          args: [reportId],
          error: e
        })
        throw new Meteor.Error('API error')
      }
      publicationObj.handleChanged(reportId, {status: REPORT_FINAL_STATUS})

      ;(function addDependees (treeNode) {
        const dependees = treeNode.depends_on.map(id => {
          let dependee
          try {
            dependee = bugById(id)
          } catch (e) {
            console.error({
              user: Meteor.userId(),
              method: `${collectionName}.finalize`,
              step: `Fetch report dependee entity (get /rest/bug/:${id})`,
              args: [reportId],
              error: e
            })
            throw new Meteor.Error('API error')
          }
          addDependees(dependee)
          return dependee
        })
        const dependencies = dependees.reduce((all, dependee) => {
          if (dependee.keywords.length === 0) { // is a case
            all.cases = all.cases || []
            all.cases.push(dependee)
          }
          // TODO: enhance for other report entities later
          return all
        }, {})
        Object.assign(treeNode, {dependencies})
      })(reportItem)

      ReportSnapshots.insert({
        createdAt: new Date(),
        createdByUser: Meteor.userId(),
        reportItem
      })
    }
  },
  [`${collectionName}.editReportField`]: fieldEditMethodMaker({
    clientCollection: Reports,
    editableFields: ['additionalComments'],
    methodName: `${collectionName}.editReportField`,
    publicationObj
  })
})

export default Reports
