import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check } from 'meteor/check'
import bugzillaApi from '../util/bugzilla-api'
import publicationFactory from './base/rest-resource-factory'

const collectionName = 'comments'

// Exported for testing purposes
export const factoryOptions = {
  uriTemplate: (claimId) => `/rest/bug/${claimId}/comment`,
  collectionName,
  dataResolver: (data, claimId) => data.bugs[claimId.toString()].comments
}

export let publicationObj // Exported for testing purposes
if (Meteor.isServer) {
  publicationObj = publicationFactory(factoryOptions, true)
  Meteor.publish('caseComments', publicationObj.publishFunc)
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

        // Fetching the full comment object by the returned id from the creation operation
        const commentData = callAPI('get', `/rest/bug/comment/${createData.data.id}`, {token}, false, true)

        // Digging the new comment object out of the response
        const newComment = commentData.data.comments[createData.data.id.toString()]
        publicationObj.handleAdded(caseId, newComment)
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
