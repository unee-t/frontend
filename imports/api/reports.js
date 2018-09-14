import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check } from 'meteor/check'
import { HTTP } from 'meteor/http'
import bugzillaApi from '../util/bugzilla-api'
import publicationFactory from './base/rest-resource-factory'
import { getUnitRoles } from './units'
import ReportSnapshots from './report-snapshots'
import { attachmentTextMatcher } from '../util/matchers'
import { makeAssociationFactory, withDocs } from './base/associations-helper'
import UnitRolesData from './unit-roles-data'
import UnitMetaData, { collectionName as unitMetaCollName} from './unit-meta-data'
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
const keywords =
  {
    field: 'keywords',
    operator: 'allwords',
    value: REPORT_KEYWORD
  }

const populateReportDependees = (reportItem, apiKey, logData) => {
  return (function addDependees (treeNode) {
    let imageAttachments, caseDetails
    try {
      const comments = bugzillaApi
        .callAPI('get', `/rest/bug/${treeNode.id}/comment`, {api_key: apiKey}, false, true)
        .data.bugs[treeNode.id.toString()].comments
      caseDetails = comments[0].text
      imageAttachments = comments.slice(1).reduce((all, comment) => {
        if (attachmentTextMatcher(comment.text)) {
          all.push(comment.text.split('\n')[1])
        }
        return all
      }, [])
    } catch (e) {
      console.error({
        ...logData,
        step: `Fetch report dependee's comments (get /rest/bug/${treeNode.id}/comments)`,
        error: e
      })
      throw new Meteor.Error('API error')
    }
    const dependees = treeNode.depends_on.map(id => {
      let dependee
      try {
        dependee = bugById(id, apiKey)
      } catch (e) {
        console.error({
          ...logData,
          step: `Fetch report dependee entity (get /rest/bug/:${id})`,
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
    Object.assign(treeNode, {dependencies, imageAttachments, caseDetails})
  })(reportItem)
}

let publicationObj
if (Meteor.isServer) {
  publicationObj = publicationFactory(factoryOptions)
  const associationFactory = makeAssociationFactory(collectionName)
  Meteor.publish(`${collectionName}.byId`, publicationObj.publishById({
    uriTemplate: idUrlTemplate
  }))

  Meteor.publish(`${collectionName}.associatedWithMe`, associationFactory(
    publicationObj.publishByCustomQuery({
      uriTemplate: () => '/rest/bug',
      queryBuilder: subHandle => {
        if (!subHandle.userId) {
          return {}
        }
        const currUser = Meteor.users.findOne(subHandle.userId)
        const { login: userIdentifier } = currUser.bugzillaCreds
        return caseQueryBuilder(
          [
            keywords,
            ...associatedCasesQueryExps(userIdentifier)
          ],
          [
            'product',
            'summary',
            'id',
            'status',
            'creation_time',
            'assigned_to'
          ]
        )
      }
    }),
    withDocs({
      cursorMaker: publishedItem => {
        return UnitMetaData.find({
          bzName: publishedItem.selectedUnit
        }, {
          bzId: 1,
          bzName: 1,
          unitType: 1
        })
      },
      collectionName: unitMetaCollName
    })
  ))

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
          keywords,
          ...associatedCasesQueryExps(userIdentifier)
        ],
        [
          'product',
          'summary',
          'id',
          'status',
          'creation_time',
          'assigned_to'
        ]
      )
    }
  }))
}

let Reports
if (Meteor.isClient) {
  Reports = new Mongo.Collection(collectionName)
  Reports.helpers({
    unitMetaData () {
      return UnitMetaData.findOne({bzName: this.selectedUnit})
    }
  })
}

const bugById = (id, apiKey) => bugzillaApi.callAPI('get', `/rest/bug/${id}`, {api_key: apiKey}, false, true).data.bugs[0]

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
      const errorTemplate = {
        user: Meteor.userId(),
        method: `${collectionName}.insert`,
        args: [params]
      }
      const { bugzillaCreds: { apiKey } } = Meteor.users.findOne(Meteor.userId())
      const { callAPI } = bugzillaApi

      let unitItem
      try {
        const requestUrl = `/rest/product?names=${encodeURIComponent(selectedUnit)}`
        const unitResult = callAPI('get', requestUrl, {api_key: apiKey}, false, true)
        unitItem = unitResult.data.products[0]
      } catch (e) {
        console.error({
          step: 'get /rest/product/...',
          error: e,
          ...errorTemplate
        })
        throw new Meteor.Error('API error')
      }
      const currUser = Meteor.user()

      const currUserRole = getUnitRoles(unitItem).find(role => role.login === currUser.bugzillaCreds.login)

      if (!currUserRole) {
        const errorMsg = 'not-authorized: The user must have a role in this unit'
        console.error({
          step: 'user auth check',
          error: errorMsg,
          ...errorTemplate
        })
        throw new Meteor.Error(errorMsg)
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
          step: 'post /rest/bug/...',
          error: e,
          ...errorTemplate
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
      const { bugzillaCreds: { apiKey } } = Meteor.users.findOne(Meteor.userId())
      const {callAPI} = bugzillaApi

      let reportItem
      try {
        reportItem = bugById(reportId, apiKey)
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

      populateReportDependees(reportItem, apiKey, {
        user: Meteor.userId(),
        method: `${collectionName}.finalize`,
        args: [reportId]
      })

      ReportSnapshots.insert({
        createdAt: new Date(),
        createdByUser: Meteor.userId(),
        reportItem
      })
    }
  },
  [`${collectionName}.makePreview`] (reportId) {
    check(reportId, Number)
    if (!Meteor.userId()) {
      throw new Meteor.Error('not-authorized')
    }
    if (Meteor.isServer) {
      const errorLogParams = {
        user: Meteor.userId(),
        method: `${collectionName}.makePreview`,
        args: [reportId]
      }
      const currUser = Meteor.user()
      const { bugzillaCreds: { apiKey } } = currUser
      let reportItem
      try {
        reportItem = bugById(reportId, apiKey)
      } catch (e) {
        console.error({
          ...errorLogParams,
          step: `Fetch main report object (get /rest/bug/${reportId})`,
          error: e
        })
        throw new Meteor.Error('API error')
      }
      let unit
      try {
        unit = bugzillaApi
          .callAPI('get', `/rest/product?names=${reportItem.product}`, {api_key: apiKey}, false, true).data.products[0]
      } catch (e) {
        console.error({
          ...errorLogParams,
          step: `Fetch report's unit (get /rest/product?names=${reportItem.product})`,
          error: e
        })
        throw new Meteor.Error('API error')
      }
      const unitMetaData = UnitMetaData.findOne({bzId: unit.id})
      const unitRolesData = UnitRolesData.find({unitBzId: unit.id}).fetch()
      const storedSnapshot = ReportSnapshots.findOne({'reportItem.id': reportId})
      let reportBlob
      if (reportItem.status === REPORT_DRAFT_STATUS || !storedSnapshot) {
        populateReportDependees(reportItem, apiKey, errorLogParams)
        reportBlob = reportItem
        if (reportItem.status !== REPORT_DRAFT_STATUS) {
          console.log(`No stored snapshot was found for finalized report ${reportId} while creating preview. Creating one as fallback`)
          ReportSnapshots.insert({
            createdAt: new Date(),
            createdByUser: Meteor.userId(),
            reportItem: reportBlob
          })
        }
      } else {
        reportBlob = storedSnapshot.reportItem
      }
      const reportCreator = Meteor.users.findOne({'bugzillaCreds.login': reportBlob.creator})
      const makeSignObj = user => {
        const userRoleObj = unitRolesData.length && unitRolesData.find(roleItem => roleItem.members.includes(user._id))
        const roleText = userRoleObj ? userRoleObj.roleType : 'Administrator'
        return {
          name: user.profile.name || user.emails[0].address.split('@')[0],
          role: roleText,
          email: user.emails[0].address,
          data_uri: ''
        }
      }
      const generationPayload = {
        id: reportBlob.id.toString(),
        template: '',
        date: (new Date()).toISOString(),
        signatures: [
          makeSignObj(reportCreator)
        ].concat(reportBlob.cc.reduce((all, loginName) => {
          const ccUser = Meteor.users.findOne({'bugzillaCreds.login': loginName})
          if (ccUser) {
            all.push(makeSignObj(ccUser))
          }
          return all
        }, [])),
        unit: {
          information: unitMetaData ? {
            name: unitMetaData.displayName || unitMetaData.bzName,
            type: unitMetaData.unitType,
            address: unitMetaData.streetAddress,
            postcode: unitMetaData.zipCode,
            city: unitMetaData.city,
            state: unitMetaData.state,
            country: unitMetaData.country,
            description: unitMetaData.moreInfo
          } : {
            name: unit.name,
            type: 'Unspecified',
            address: 'N/A',
            postcode: '',
            city: 'N/A',
            state: 'N/A',
            country: 'N/A',
            description: ''
          }
        },
        report: {
          name: reportBlob.summary,
          creator: reportCreator.profile.name || reportCreator.emails[0].address.split('@')[0],
          description: reportBlob.caseDetails,
          images: reportBlob.imageAttachments,
          cases: reportBlob.dependencies.cases ? reportBlob.dependencies.cases.map(caseItem => ({
            title: caseItem.summary,
            images: caseItem.imageAttachments,
            category: caseItem.rep_platform,
            status: caseItem.status,
            details: caseItem.caseDetails
          })) : [],
          inventory: [],
          rooms: [],
          comments: reportBlob.whiteboard
        }
      }
      const { PDFGEN_LAMBDA_URL, API_ACCESS_TOKEN } = process.env
      let response
      try {
        response = HTTP.call('POST', PDFGEN_LAMBDA_URL, {
          data: generationPayload,
          headers: {
            Authorization: `Bearer ${API_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        })
      } catch (e) {
        console.error({
          ...errorLogParams,
          step: `Calling PdfGen Lambda`,
          error: e
        })
        throw new Meteor.Error('Export service error')
      }
      return {
        url: response.data.HTML
      }
    }
  },
  [`${collectionName}.editReportField`]: fieldEditMethodMaker({
    clientCollection: Reports,
    editableFields: ['additionalComments', 'title'],
    methodName: `${collectionName}.editReportField`,
    publicationObj
  })
})

export default Reports
