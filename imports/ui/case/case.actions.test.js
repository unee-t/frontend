/* eslint-env mocha */

import { expect } from 'meteor/practicalmeteor:chai'
import { sinon } from 'meteor/practicalmeteor:sinon'
import { Meteor } from 'meteor/meteor'
import {
  createComment, CREATE_COMMENT,
  createAttachment, CREATE_ATTACHMENT,
  retryAttachment, RETRY_ATTACHMENT
} from './case.actions'

if (Meteor.isClient) {
  describe('Case details screen actions', () => {
    beforeEach(() => {
      sinon.stub(Meteor, 'call')
    })
    afterEach(() => {
      Meteor.call.restore()
    })
    it('should return an action object when createComment is called', () => {
      const retVal = createComment('bla bla', '123')

      expect(retVal).to.deep.equal({
        type: CREATE_COMMENT,
        text: 'bla bla',
        caseId: '123'
      })
    })

    it('should return an action object with a random processId when createAttachment is called', () => {
      const preview = 'someBase64Url'
      const file = { dummyObject: true }
      const retVal = createAttachment(preview, file, 64)

      expect(retVal).to.contain({
        type: CREATE_ATTACHMENT,
        caseId: 64,
        preview,
        file
      })
      expect(retVal.processId).to.be.a('number')
    })

    it('should return an action object with the provided processId when createAttachment is called', () => {
      const preview = 'someBase64Url'
      const file = { dummyObject: true }
      const retVal = createAttachment(preview, file, 64, 111)

      expect(retVal).to.contain({
        type: CREATE_ATTACHMENT,
        caseId: 64,
        processId: 111,
        preview,
        file
      })
      expect(retVal.processId).to.be.a('number')
    })

    it('should return an action object when retryAttachment is called', () => {
      const process = {
        processId: 123,
        preview: 'asdasd',
        file: { a: 0 },
        caseId: 563
      }

      const retVal = retryAttachment(process)

      expect(retVal).to.contain(process)
      expect(retVal.type).to.equal(RETRY_ATTACHMENT)
    })
  })
}
