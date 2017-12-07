/* eslint-env mocha */

import { expect } from 'meteor/practicalmeteor:chai'
import { sinon } from 'meteor/practicalmeteor:sinon'
import { Meteor } from 'meteor/meteor'
import { createComment } from './case.actions'

if (Meteor.isClient) {
  describe('Case details screen actions', () => {
    beforeEach(() => {
      sinon.stub(Meteor, 'call')
    })
    afterEach(() => {
      Meteor.call.restore()
    })
    describe('createComment', () => {
      it('should return a function', () => {
        const retVal = createComment('bla bla', '123')

        expect(retVal).to.be.a('function')
      })
      it('should call the "comments.insert" meteor method when triggered', () => {
        const content = 'bla bla'
        const caseIdStr = '123'

        const actionFunc = createComment(content, caseIdStr)
        actionFunc()

        expect(Meteor.call).to.have.been.calledWith('comments.insert', content, 123)
      })
    })
  })
}
