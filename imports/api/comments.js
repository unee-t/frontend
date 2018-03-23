import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check } from 'meteor/check'
import bugzillaApi from '../util/bugzilla-api'
import publicationFactory from './base/rest-resource-factory'
import { makeAssociationFactory, withUsers } from './base/associations-helper'

const collectionName = 'comments'

// Exported for testing purposes
export const factoryOptions = {
  collectionName,
  dataResolver: (data, claimId) => {
    return data.bugs[claimId.toString()].comments
  }
}

export let publicationObj // Exported for testing purposes
if (Meteor.isServer) {
  const associationFactory = makeAssociationFactory(collectionName)
  publicationObj = publicationFactory(factoryOptions)
  Meteor.publish('caseComments', associationFactory(publicationObj.publishById({
    uriTemplate: caseId => `/rest/bug/${caseId}/comment`,
    addedMatcherFactory: caseId => comment => comment.bug_id.toString() === caseId.toString()
  }),
   withUsers(commentItem => [commentItem.creator])
  ))
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

    if (Meteor.isClient) {
      // Simulating the comment creation on the client
      Comments.insert({
        id: Math.round(Math.random() * Number.MAX_VALUE),
        creator: currUser.emails[0].address,
        text,
        creation_time: (new Date()).toISOString(),
        bug_id: caseId
      })
    } else {
      const payload = {
        comment: text,
        token: currUser.bugzillaCreds.token
      }

      try {
        // Creating the comment
        const createData = callAPI('post', `/rest/bug/${caseId}/comment`, payload, false, true)
        const { token } = currUser.bugzillaCreds
        console.log('createData.data', createData.data)

        // Fetching the full comment object by the returned id from the creation operation
        const commentData = callAPI('get', `/rest/bug/comment/${createData.data.id}`, {token}, false, true)
        console.log('commentData.data', commentData.data)

        // Digging the new comment object out of the response
        const newComment = commentData.data.comments[createData.data.id.toString()]
        publicationObj.handleAdded(newComment)
      } catch (e) {
        console.error(e)
        throw new Meteor.Error('API error')
      }
    }
  }
})

let Comments
if (Meteor.isClient) {
  Comments = new Mongo.Collection(collectionName)
}

export default Comments
