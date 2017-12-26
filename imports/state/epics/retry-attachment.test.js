/* eslint-env mocha */

import { Meteor } from 'meteor/meteor'
import { expect } from 'meteor/practicalmeteor:chai'
import { sinon } from 'meteor/practicalmeteor:sinon'
import { retryAttachment } from './retry-attachment'
import { RETRY_ATTACHMENT, ATTACHMENT_UPLOAD_COMPLETED, CREATE_ATTACHMENT } from '../../ui/case/case.actions'
import { ReduxInput } from '../../test/util'

if (Meteor.isClient) {
  describe('RetryAttachment epic', () => {
    let input, output, nextSpy
    beforeEach(() => {
      sinon.stub(Meteor, 'userId')
      input = new ReduxInput()
      output = retryAttachment(input)
      nextSpy = sinon.spy()
    })
    afterEach(() => {
      Meteor.userId.restore()
    })

    it('should filter out actions when the user is not logged in', done => {
      process.nextTick(() => {
        input.next({
          type: RETRY_ATTACHMENT
        })
        input.complete()
      })

      output.subscribe(nextSpy, null, () => {
        expect(nextSpy).to.not.have.been.called()
        done()
      })
    })

    it('should publish the right two actions when called properly', done => {
      Meteor.userId.returns(42)
      const action = {
        type: RETRY_ATTACHMENT,
        preview: 'someImageDataUrl',
        file: {type: 'blob'},
        processId: 54
      }

      process.nextTick(() => {
        input.next(action)
        input.complete()
      })

      output.subscribe(nextSpy, null, () => {
        expect(nextSpy.firstCall).to.have.been.calledWithMatch({
          type: ATTACHMENT_UPLOAD_COMPLETED,
          processId: action.processId,
          caseId: action.caseId
        })
        expect(nextSpy.secondCall).to.have.been.calledWithMatch({
          type: CREATE_ATTACHMENT,
          processId: action.processId,
          preview: action.preview,
          file: action.file,
          caseId: action.caseId
        })
        done()
      })
    })
  })
}
