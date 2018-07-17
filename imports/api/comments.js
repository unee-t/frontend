import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check } from 'meteor/check'
import bugzillaApi from '../util/bugzilla-api'
import publicationFactory from './base/rest-resource-factory'
import { makeAssociationFactory, withUsers } from './base/associations-helper'

export const collectionName = 'comments'

// Exported for testing purposes
export const factoryOptions = {
  collectionName,
  dataResolver: (data, claimId) => {
    return data.bugs[claimId.toString()].comments
  }
}

export let publicationObj // Exported for testing purposes
let FailedComments
if (Meteor.isServer) {
  const associationFactory = makeAssociationFactory(collectionName)
  publicationObj = publicationFactory(factoryOptions)
  Meteor.publish(
    'caseComments',
    associationFactory(
      publicationObj.publishById({
        uriTemplate: caseId => `/rest/bug/${caseId}/comment`,
        addedMatcherFactory: caseId => comment => comment.bug_id.toString() === caseId.toString()
      }),
      withUsers(commentItem => [commentItem.creator])
    )
  )
  FailedComments = new Mongo.Collection('failedComments')
}

Meteor.methods({
  'comments.insert' (text, caseId) {
    check(text, String)
    check(caseId, Number)

    // Making sure the user is logged in before inserting a comment
    if (!Meteor.userId()) {
      throw new Meteor.Error('not-authorized')
    }

    const { callAPI } = bugzillaApi
    const currUser = Meteor.users.findOne({_id: Meteor.userId()})
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

      console.log(`${currUser.bugzillaCreds.login} is commenting "${text}" on case ${caseId}`)

      try {
        // Creating the comment
        const createData = callAPI('post', `/rest/bug/${caseId}/comment`, payload, false, true)
        const { apiKey } = currUser.bugzillaCreds

        // Fetching the full comment object by the returned id from the creation operation
        const commentData = callAPI(
          'get', `/rest/bug/comment/${createData.data.id}`, {api_key: apiKey}, false, true
        )

        // Digging the new comment object out of the response
        const newComment = commentData.data.comments[createData.data.id.toString()]
        publicationObj.handleAdded(newComment)
      } catch (e) {
        console.error({
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
  }
})

let Comments
if (Meteor.isClient) {
  Comments = new Mongo.Collection(collectionName)
}

export default Comments
