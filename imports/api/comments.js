import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check } from 'meteor/check'
import bugzillaApi from '../util/bugzilla-api'
import publicationFactory from './base/rest-resource-factory'
import { makeAssociationFactory, withUsers } from './base/associations-helper'
import { logger } from '../util/logger'
import UnitMetaData from './unit-meta-data'
import { idUrlTemplate, factoryOptions as casesFactoryOptions, transformCaseForClient } from './cases'
import { serverHelpers } from './units'

export const collectionName = 'comments'

// Exported for testing purposes
export const factoryOptions = {
  collectionName,
  dataResolver: (data, caseId) => {
    return data.bugs[caseId.toString()].comments
  }
}

const formatFloorPlanCommentText = (floorPlanId, floorPlanPins) =>
  `[!floorPlan(${floorPlanId})]\n${floorPlanPins.map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(';')}`

export const createFloorPlanComment = ({ unitBzId, caseId, userApiKey, floorPlanPins, errorLogParams }) => {
  const metaData = UnitMetaData.findOne({ bzId: unitBzId })
  const lastFloorPlan = metaData.floorPlanUrls && metaData.floorPlanUrls.slice(-1)[0]
  if (lastFloorPlan && !lastFloorPlan.disabled) {
    const payload = {
      comment: formatFloorPlanCommentText(lastFloorPlan.id, floorPlanPins),
      api_key: userApiKey
    }

    try {
      // Creating the comment
      const createData = bugzillaApi.callAPI('post', `/rest/bug/${caseId}/comment`, payload, false, true)
      if (createData.data.error) {
        throw new Meteor.Error(createData.data.error)
      }
      return createData.data.id
    } catch (e) {
      logger.error({
        ...errorLogParams,
        error: e
      })
      throw new Meteor.Error(`API Error: ${e.response ? e.response.data.message : e.message}`)
    }
  }
}

export let publicationObj // Exported for testing purposes
export let FailedComments
if (Meteor.isServer) {
  const associationFactory = makeAssociationFactory(collectionName)
  publicationObj = publicationFactory(factoryOptions)
  Meteor.publish(
    `${collectionName}.byCaseId`,
    associationFactory(
      publicationObj.publishById({
        uriTemplate: caseId => `/rest/bug/${caseId}/comment`,
        addedMatcherFactory: caseId => comment => comment.bug_id.toString() === caseId.toString()
      }),
      withUsers(commentItem => [commentItem.creator])
    )
  )

  Meteor.publish(
    `${collectionName}.byId`,
    publicationFactory({
      collectionName,
      dataResolver: (data, commentId) => {
        return data.comments[commentId.toString()]
      }
    }).publishById({
      uriTemplate: id => `/rest/bug/comment/${id}`
    })
  )
  FailedComments = new Mongo.Collection('failedComments')
}

Meteor.methods({
  [`${collectionName}.insert`] (text, caseId) {
    check(text, String)
    check(caseId, Number)

    // Making sure the user is logged in before inserting a comment
    if (!Meteor.userId()) {
      throw new Meteor.Error('not-authorized')
    }

    const { callAPI } = bugzillaApi
    const currUser = Meteor.users.findOne({ _id: Meteor.userId() })
    const mockCommentObject = {
      creator: currUser.bugzillaCreds.login,
      creation_time: (new Date()).toISOString(),
      bug_id: caseId,
      text
    }
    if (Meteor.isClient) {
      // Simulating the comment creation on the client
      Comments.insert({
        id: Math.round(Math.random() * Number.MAX_VALUE),
        ...mockCommentObject
      })
    } else {
      const payload = {
        comment: text,
        api_key: currUser.bugzillaCreds.apiKey
      }

      logger.info(`${currUser.bugzillaCreds.login} is commenting "${text}" on case ${caseId}`)

      try {
        // Creating the comment
        const createData = callAPI('post', `/rest/bug/${caseId}/comment`, payload, false, true)
        const { apiKey } = currUser.bugzillaCreds

        // Fetching the full comment object by the returned id from the creation operation
        const commentData = callAPI(
          'get', `/rest/bug/comment/${createData.data.id}`, { api_key: apiKey }, false, true
        )

        // Digging the new comment object out of the response
        const newComment = commentData.data.comments[createData.data.id.toString()]
        publicationObj.handleAdded(newComment)
      } catch (e) {
        logger.error({
          user: Meteor.userId(),
          method: `${collectionName}.insert`,
          args: [text, caseId],
          error: e.response.data
        })
        FailedComments.insert({
          error: e,
          ...mockCommentObject
        })
        throw new Meteor.Error(`API Error: ${e.response.data.message}`)
      }
    }
  },
  [`${collectionName}.insertFloorPlan`] (caseId, floorPlanPins, floorPlanId) {
    check(caseId, Number)
    check(floorPlanPins, Array)
    const currUser = Meteor.user()
    if (Meteor.isClient) {
      Comments.insert({
        id: Math.round(Math.random() * Number.MAX_VALUE),
        creator: currUser.bugzillaCreds.login,
        creation_time: (new Date()).toISOString(),
        bug_id: caseId,
        text: formatFloorPlanCommentText(floorPlanId, floorPlanPins)
      })
    }
    if (Meteor.isServer) {
      const { callAPI } = bugzillaApi
      const resp = callAPI('get', idUrlTemplate(caseId), {}, true, true)
      const caseItem = transformCaseForClient(casesFactoryOptions.dataResolver(resp.data)[0])

      const unitItem = serverHelpers.getAPIUnitByName(caseItem.selectedUnit)

      const commentId = createFloorPlanComment({
        unitBzId: unitItem.id,
        userApiKey: currUser.bugzillaCreds.apiKey,
        errorLogParams: {
          user: Meteor.userId(),
          method: `${collectionName}.insertFloorPlan`,
          args: [caseId, floorPlanPins]
        },
        caseId,
        floorPlanPins
      })

      // Fetching the full comment object by the returned id from the creation operation
      const commentData = callAPI(
        'get', `/rest/bug/comment/${commentId}`, { api_key: currUser.bugzillaCreds.apiKey }, false, true
      )
      const newComment = commentData.data.comments[commentId.toString()]
      publicationObj.handleAdded(newComment)
    }
  }
})

let Comments
if (Meteor.isClient) {
  Comments = new Mongo.Collection(collectionName)
}

export default Comments
