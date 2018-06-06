/* eslint-env mocha */

import { expect } from 'meteor/practicalmeteor:chai'
import { Meteor } from 'meteor/meteor'
import { sinon } from 'meteor/practicalmeteor:sinon'
import bugzillaApi from '../util/bugzilla-api'
import Comments, { factoryOptions, publicationObj } from './comments'

describe('Comments collection', () => {
  if (Meteor.isServer) {
    describe('RestResourceFactory options', () => {
      it('should contain a proper dataResolver', () => {
        const data = factoryOptions.dataResolver({
          bugs: {
            '52': {
              comments: [1, 2, 3],
              id: 52
            },
            '42': {
              comments: [4, 5, 6],
              id: 42
            },
            '99': {
              comments: [7, 8, 9],
              id: 99
            }
          }
        }, 42)

        expect(data).to.deep.equal([4, 5, 6])
      })
    })
  }
  describe('methods', () => {
    beforeEach(() => {
      sinon.stub(Meteor, 'userId')
      sinon.stub(Meteor.users, 'findOne')
    })
    afterEach(() => {
      Meteor.userId.restore()
      Meteor.users.findOne.restore()
    })
    if (Meteor.isServer) {
      describe('comments.insert', () => {
        let callAPIStub, handleAddedStub
        beforeEach(() => {
          callAPIStub = sinon.stub(bugzillaApi, 'callAPI')
          handleAddedStub = sinon.stub(publicationObj, 'handleAdded')
        })
        afterEach(() => {
          callAPIStub.restore()
          handleAddedStub.restore()
        })
        const commentsInsert = Meteor.server.method_handlers['comments.insert']
        it('should throw an error if the first arg is not a string', () => {
          const boundFunc = commentsInsert.bind(null, 123)

          expect(boundFunc).to.throw('Expected string, got number')
        })
        it('should throw an error if the second arg is not a number', () => {
          const boundFunc = commentsInsert.bind(null, 'abc', 'efg')

          expect(boundFunc).to.throw('Expected number, got string')
        })
        it('should throw an error if there is no logged in user', () => {
          const boundFunc = commentsInsert.bind(null, 'abc', 123)

          expect(boundFunc).to.throw('not-authorized')
        })
        it('should "POST" to "/rest/bug/{caseId}/comment" with the comment and the user\'s api key, and throw if it fails', () => {
          const apiKey = 'sm23ASDjsajq34Casda4'
          const comment = 'Something to say'
          const caseId = 123
          Meteor.userId.returns(1)
          Meteor.users.findOne.returns({
            bugzillaCreds: {apiKey}
          })
          callAPIStub.throws()

          const bound = commentsInsert.bind(null, comment, caseId)

          expect(bound).to.throw(Meteor.Error)
          expect(callAPIStub).to.have.been.calledOnce()
          expect(callAPIStub).to.have.been.calledWithMatch(
            'post', `/rest/bug/${caseId}/comment`, {comment, api_key: apiKey}, false, true
          )
        })
        it('should fetch the created comment by "GET /rest/bug/comment/{commentId}", and throw if it fails', () => {
          const newCommentId = 432
          const apiKey = 'asdkjajsej12@QasdAj2kad'
          Meteor.userId.returns(1)
          Meteor.users.findOne.returns({
            bugzillaCreds: {apiKey}
          })
          callAPIStub.onFirstCall().returns({
            data: {id: newCommentId}
          })
          callAPIStub.onSecondCall().throws()

          const bound = commentsInsert.bind(null, 'bla bla bla', 123)

          expect(bound).to.throw(Meteor.Error)
          expect(callAPIStub).to.have.been.calledTwice()
          expect(callAPIStub).to.have.been.calledWithMatch(
            'get', `/rest/bug/comment/${newCommentId}`, {api_key: apiKey}, false, true
          )
        })
        it('should notify subscribers by using "handleAdded" with the new comment object for the specified caseId', () => {
          const caseId = 987
          const msgContent = 'My new message'
          const newCommentObj = {
            creator: 'bla@example.com',
            text: msgContent,
            bug_id: caseId,
            id: Math.round(Math.random() * Number.MAX_VALUE),
            creation_time: (new Date()).toISOString()
          }
          Meteor.userId.returns(1)
          Meteor.users.findOne.returns({
            bugzillaCreds: {apiKey: 'sdfS5aDra923sAS'}
          })
          callAPIStub.onFirstCall().returns({
            data: {id: newCommentObj.id}
          })
          callAPIStub.onSecondCall().returns({
            data: {
              comments: {
                [newCommentObj.id]: newCommentObj
              }
            }
          })

          commentsInsert(msgContent, caseId)

          expect(handleAddedStub).to.have.been.calledWith(newCommentObj)
        })
      })
    }
    if (Meteor.isClient) {
      describe('comments.insert (client simulation)', () => {
        it('should fetch the curr user and insert a new document into the Comments collection', () => {
          const emailAddr = 'dummy@example.com'
          const msgContent = 'My new message'
          const caseId = 555
          Meteor.userId.returns(5)
          Meteor.users.findOne.returns({
            emails: [{ address: emailAddr }]
          })

          Meteor.call('comments.insert', msgContent, caseId, () => {}) // Empty cb fn used to silence the server error

          expect(Meteor.users.findOne).to.have.been.calledWithMatch({_id: 5})
          const newComment = Comments.findOne({bug_id: caseId})
          expect(newComment).to.not.be.null()
          expect(newComment).to.include({
            creator: emailAddr,
            text: msgContent,
            bug_id: caseId
          })
          expect(newComment.creation_time).to.be.a('string')
          expect(newComment.id).to.be.a('number')
        })
      })
    }
  })
})
