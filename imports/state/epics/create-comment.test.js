/* eslint-env mocha */

import { Meteor } from 'meteor/meteor'
import { expect } from 'meteor/practicalmeteor:chai'
import { sinon } from 'meteor/practicalmeteor:sinon'
import { createComment } from './create-comment'
import { CREATE_COMMENT } from '../../ui/case/case.actions'
import { ReduxInput } from '../../test/util'

if (Meteor.isClient) {
  describe('CreateComment epic', () => {
    beforeEach(() => {
      sinon.stub(Meteor, 'call')
      sinon.stub(Meteor, 'userId')
    })
    afterEach(() => {
      Meteor.call.restore()
      Meteor.userId.restore()
    })

    it('should call comments.insert on the server', (done) => {
      const input = new ReduxInput()
      const output = createComment(input)
      Meteor.call.yields()

      Meteor.userId.returns(99)

      process.nextTick(() => {
        input.next({
          type: CREATE_COMMENT,
          text: 'bla bla',
          caseId: '999'
        })
        input.complete()
      })

      output.subscribe(null, null, () => {
        expect(Meteor.call).to.have.been.calledWith('comments.insert', 'bla bla', 999)
        done()
      })
    })
  })
}
