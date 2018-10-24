import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check } from 'meteor/check'
import { HTTP } from 'meteor/http'
import { Email } from 'meteor/email'
import bugzillaApi from '../util/bugzilla-api'
import publicationFactory from './base/rest-resource-factory'
import { getUnitRoles, serverHelpers } from './units'
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
import { emailValidator } from '../util/validators'
import reportPdfSharedEmail from '../email-templates/report-pdf-shared'

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

export const generatePreviewUrl = ({ reportBlob, unitRoles, unitMetaData, signatureMap, errorLogParams }) => {
  const reportCreator = Meteor.users.findOne({'bugzillaCreds.login': reportBlob.creator})
  const makeSignObj = user => {
    let isOccupant = false
    const userRoleObj = unitRoles.find(role => !!role.members.find(member => {
      if (member.id === user._id) {
        isOccupant = member.isOccupant
        return true
      }
    }))
    const roleText = userRoleObj ? userRoleObj.roleType + (isOccupant ? ' (Occupant)' : '') : 'Administrator'
    const signImgUri = signatureMap[user.bugzillaCreds.login] || ''
    return {
      name: user.profile.name || user.emails[0].address.split('@')[0],
      role: roleText,
      email: user.emails[0].address,
      data_uri: signImgUri
    }
  }
  const generationPayload = {
    id: reportBlob.id.toString(),
    template: '',
    date: (new Date()).toISOString(),
    signatures: [
      makeSignObj(reportCreator)
    ].concat(Object.keys(signatureMap).reduce((all, loginName) => {
      const ccUser = Meteor.users.findOne({'bugzillaCreds.login': loginName})
      if (ccUser && ccUser._id !== reportCreator._id) {
        all.push(makeSignObj(ccUser))
      }
      return all
    }, [])),
    unit: {
      information: {
        name: unitMetaData.displayName || unitMetaData.bzName,
        type: unitMetaData.unitType,
        address: unitMetaData.streetAddress,
        postcode: unitMetaData.zipCode,
        city: unitMetaData.city,
        state: unitMetaData.state,
        country: unitMetaData.country,
        description: unitMetaData.moreInfo
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
  return response.data.HTML
}

export const generatePDFFromPreview = (previewUrl, errorLogParams) => {
  const { PDFCONVERT_LAMBDA_URL, API_ACCESS_TOKEN } = process.env
  let response
  try {
    response = HTTP.call('POST', PDFCONVERT_LAMBDA_URL, {
      data: {
        'document_url': previewUrl
      },
      headers: {
        Authorization: `Bearer ${API_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })
  } catch (e) {
    console.error({
      ...errorLogParams,
      step: `Calling PdfConvert (Prince) Lambda`,
      error: e
    })
    throw new Meteor.Error('Export service error')
  }

  return response.data.PDF
}

export const fetchReportUnitInfo = unitBzName => {
  const unitMetaData = UnitMetaData.findOne({bzName: unitBzName}) || {
    displayName: unitBzName,
    unitType: 'Unspecified',
    streetAddress: 'N/A',
    zipCode: '',
    city: 'N/A',
    state: 'N/A',
    country: 'N/A',
    moreInfo: ''
  }
  const unitRoles = unitMetaData ? UnitRolesData.find({
    unitId: unitBzName
  }, {
    fields: {
      roleType: 1,
      members: 1,
      defaultAssigneeId: 1
    }
  }).fetch() : []

  return {
    unitMetaData,
    unitRoles
  }
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
            'assigned_to',
            'creation_time'
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
        unitItem = serverHelpers.getAPIUnitByName(selectedUnit, apiKey)
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
  [`${collectionName}.finalize`] (reportId, signatureMap) {
    check(reportId, Number)
    check(signatureMap, Object)
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
      const errorLogParams = {
        user: Meteor.userId(),
        method: `${collectionName}.finalize`,
        args: [reportId]
      }
      try {
        callAPI('put', `/rest/bug/${reportId}`, requestPayload, false, true)
      } catch (e) {
        console.error({
          step: 'Report status update (put /rest/bug/:reportId)',
          error: e,
          ...errorLogParams
        })
        throw new Meteor.Error('API error')
      }
      publicationObj.handleChanged(reportId, {status: REPORT_FINAL_STATUS})

      populateReportDependees(reportItem, apiKey, {
        user: Meteor.userId(),
        method: `${collectionName}.finalize`,
        args: [reportId]
      })
      const reportUnitInfo = fetchReportUnitInfo(reportItem.product)
      const previewUrl = generatePreviewUrl({
        reportBlob: reportItem,
        signatureMap,
        errorLogParams,
        ...reportUnitInfo
      })
      const pdfUrl = generatePDFFromPreview(previewUrl, errorLogParams)
      ReportSnapshots.insert({
        createdAt: new Date(),
        createdByUser: Meteor.userId(),
        reportItem,
        previewUrl,
        pdfUrl,
        ...reportUnitInfo
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
      const storedSnapshot = ReportSnapshots.findOne({'reportItem.id': reportId})
      let reportBlob, signatureMap, previewUrl
      if (!storedSnapshot) {
        populateReportDependees(reportItem, apiKey, errorLogParams)
        reportBlob = reportItem
        const reportUnitInfo = fetchReportUnitInfo(reportItem.product)
        signatureMap = {}
        previewUrl = generatePreviewUrl({reportBlob, signatureMap, errorLogParams, ...reportUnitInfo})
        if (reportItem.status !== REPORT_DRAFT_STATUS) {
          console.log(`No stored snapshot was found for finalized report ${reportId} while creating preview. Creating one as fallback`)
          const pdfUrl = generatePDFFromPreview(previewUrl)
          ReportSnapshots.insert({
            createdAt: new Date(),
            createdByUser: Meteor.userId(),
            reportItem: reportBlob,
            previewUrl,
            pdfUrl,
            ...reportUnitInfo
          })
        }
      } else {
        previewUrl = storedSnapshot.previewUrl
      }
      return {
        url: previewUrl
      }
    }
  },
  [`${collectionName}.shareWithRecipients`]: (reportId, newEmails, selectedRecipientLogins) => {
    check(reportId, Number)
    check(newEmails, Array)
    check(selectedRecipientLogins, Array)
    if (!Meteor.userId()) {
      throw new Meteor.Error('not-authorized')
    }
    const faultyEmail = newEmails.find(r => !emailValidator(r))
    if (faultyEmail) {
      throw new Meteor.Error('Invalid email address', faultyEmail)
    }
    const recipientUsers = selectedRecipientLogins.map(login => {
      const user = Meteor.users.findOne({'bugzillaCreds.login': login})
      return user || {
        profile: {},
        emails: [{
          address: login
        }]
      }
    })
    if (Meteor.isServer) {
      const errorLogParams = {
        user: Meteor.userId(),
        method: `${collectionName}.shareWithRecipients`,
        args: [reportId, newEmails]
      }
      const sender = Meteor.user()
      const { bugzillaCreds: { apiKey } } = sender

      // Calling the API just for an authorization check. The data is meaningless
      try {
        bugById(reportId, apiKey)
      } catch (e) {
        console.error({
          ...errorLogParams,
          step: `Fetch main report object (get /rest/bug/${reportId})`,
          error: e
        })
        throw new Meteor.Error('Failed to access the report with your credentials')
      }
      const reportSnapshot = ReportSnapshots.findOne({'reportItem.id': reportId})
      if (!reportSnapshot) {
        throw new Meteor.Error('There is no finalized export for this report yet')
      }

      const senderRoleObj = reportSnapshot.unitRoles.find(role => role.members.find(mem => mem.id === sender._id))
      const senderRole = senderRoleObj ? senderRoleObj.roleType : 'Stakeholder'
      const reportTitle = reportSnapshot.reportItem.summary
      const unitName = reportSnapshot.unitMetaData.displayName || reportSnapshot.unitMetaData.bzName

      const failedRecipients = []
      const succeededRecipients = []
      newEmails.map(email => ({
        profile: {},
        emails: [{
          address: email
        }]
      })).concat(recipientUsers).forEach(recipientObj => {
        const emailContent = reportPdfSharedEmail(
          sender,
          senderRole,
          recipientObj,
          reportId,
          reportSnapshot.pdfUrl,
          reportTitle,
          unitName
        )
        try {
          Email.send({
            to: recipientObj.emails[0].address,
            from: process.env.FROM_EMAIL,
            ...emailContent
          })
          succeededRecipients.push(recipientObj.emails[0].address)
        } catch (e) {
          console.error({
            ...errorLogParams,
            step: `Send report pdf email to ${recipientObj.emails[0].address}`,
            error: e
          })
          failedRecipients.push(recipientObj.profile.name || recipientObj.emails[0].address.split('@')[0])
        }
      })
      if (succeededRecipients.length) {
        ReportSnapshots.update(reportSnapshot._id, {
          $push: {
            sharedWith: {
              sendDate: new Date(),
              recipients: succeededRecipients,
              failedRecipients
            }
          }
        })
      }
      if (failedRecipients.length) {
        throw new Meteor.Error('Failed to share with: ' + failedRecipients.join(', '))
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
