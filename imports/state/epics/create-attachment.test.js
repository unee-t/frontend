/* eslint-env mocha */
/* global File, FormData */

import { Meteor } from 'meteor/meteor'
import { expect } from 'meteor/practicalmeteor:chai'
import { sinon } from 'meteor/practicalmeteor:sinon'
import { createAttachment } from './create-attachment'
import {
  CREATE_ATTACHMENT,
  CREATE_COMMENT,
  ATTACHMENT_UPLOADING,
  ATTACHMENT_UPLOAD_PROGRESS,
  ATTACHMENT_UPLOAD_COMPLETED,
  ATTACHMENT_UPLOAD_ERROR
} from '../../ui/case/case.actions'
import { ReduxInput } from '../../test/util'
import { Subject } from 'rxjs/Subject'

if (Meteor.isClient) {
  describe('CreateAttachment epic', () => {
    let input, output, nextSpy, ajaxStub, ajaxStream, clock, initialPublicSettings
    const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/demo-env/image/upload'
    const CLOUDINARY_PRESET = 'asddsd23asd'
    const inputAction = {
      type: CREATE_ATTACHMENT,
      processId: 12828,
      preview: 'someImageDataUrl',
      file: new File([], 'image.jpg'),
      caseId: 371
    }
    const uploadedUrl = 'https://res.clodinary.com/someUrl'
    before(() => {
      clock = sinon.useFakeTimers()
      initialPublicSettings = Meteor.settings.public
      Meteor.settings.public = {
        CLOUDINARY_URL,
        CLOUDINARY_PRESET
      }
    })
    after(() => {
      clock.restore()
      Meteor.settings.public = initialPublicSettings
    })
    beforeEach(() => {
      sinon.stub(Meteor, 'userId')
      input = new ReduxInput()
      ajaxStub = sinon.stub()
      ajaxStream = new Subject()
      ajaxStub.returns(ajaxStream)
      output = createAttachment(input, null, {ajax: ajaxStub})
      nextSpy = sinon.spy()
    })
    afterEach(() => {
      Meteor.userId.restore()
    })

    it('should filter out actions when the user is not logged in', done => {
      process.nextTick(() => {
        input.next({
          type: CREATE_ATTACHMENT
        })
        input.complete()
      })

      output.subscribe(nextSpy, null, () => {
        expect(nextSpy).to.not.have.been.called()
        done()
      })
    })

    it('should publish actions that correspond with the progress of the upload', done => {
      Meteor.userId.returns(42)

      process.nextTick(() => {
        input.next(inputAction)

        const { progressSubscriber } = ajaxStub.firstCall.args[0]
        progressSubscriber.next({lengthComputable: false}) // Should not yield any action
        progressSubscriber.next({
          lengthComputable: true,
          loaded: 400,
          total: 2000 // 20%
        }) // Should yield the first progress action immediately
        clock.tick(500)
        progressSubscriber.next({
          lengthComputable: true,
          loaded: 800,
          total: 2000
        }) // Should not yield any action, as it is being swallowed by the buffer
        clock.tick(300)
        progressSubscriber.next({
          lengthComputable: true,
          loaded: 1500,
          total: 2000 // 75%
        }) // Added as the last action in the buffer of this 1000ms
        clock.tick(1300) // Should make the previous event yield an action
        progressSubscriber.next({
          lengthComputable: true,
          loaded: 1800,
          total: 2000 // 90%
        }) // Should yield an action, as 1100ms should have passed since the last event
        clock.tick(1100)
        progressSubscriber.next({
          lengthComputable: true,
          loaded: 1900,
          total: 2000 // 95%
        }) // Should yield the action immediately (to be received before the stream is cut by ajaxStream output)
        clock.tick(100)

        ajaxStream.next({
          response: {
            secure_url: uploadedUrl
          }
        })

        progressSubscriber.complete()
        ajaxStream.complete()
        input.complete()
      })

      output.subscribe(nextSpy, null, () => {
        // Asserting proper ajax request execution
        expect(ajaxStub).to.have.been.calledWithMatch({
          url: CLOUDINARY_URL,
          responseType: 'json',
          method: 'POST',
          body: sinon.match.instanceOf(FormData),
          progressSubscriber: sinon.match.instanceOf(Subject)
        })
        expect(ajaxStub.firstCall.args[0].body.get('file')).to.equal(inputAction.file)
        expect(ajaxStub.firstCall.args[0].body.get('upload_preset')).to.equal(CLOUDINARY_PRESET)
        expect(ajaxStub.firstCall.args[0].body.get('folder')).to.equal('42')

        // Asserting the actions published by the epic
        expect(nextSpy).to.have.been.callCount(7)
        expect(nextSpy.firstCall).to.have.been.calledWithMatch({
          ...inputAction,
          type: ATTACHMENT_UPLOADING
        })
        expect(nextSpy.secondCall).to.have.been.calledWithMatch({
          ...inputAction,
          type: ATTACHMENT_UPLOAD_PROGRESS,
          percent: 20
        })
        expect(nextSpy.thirdCall).to.have.been.calledWithMatch({
          ...inputAction,
          type: ATTACHMENT_UPLOAD_PROGRESS,
          percent: 75
        })
        expect(nextSpy.getCall(3)).to.have.been.calledWithMatch({
          ...inputAction,
          type: ATTACHMENT_UPLOAD_PROGRESS,
          percent: 90
        })
        expect(nextSpy.getCall(4)).to.have.been.calledWithMatch({
          ...inputAction,
          type: ATTACHMENT_UPLOAD_PROGRESS,
          percent: 95
        })
        expect(nextSpy.getCall(5)).to.have.been.calledWithMatch({
          ...inputAction,
          type: ATTACHMENT_UPLOAD_COMPLETED
        })
        expect(nextSpy.getCall(6)).to.have.been.calledWithMatch({
          type: CREATE_COMMENT,
          text: '[!attachment]\n' + uploadedUrl,
          caseId: 371
        })

        done()
      })
    })

    it('should publish actions that correspond with upload errors', done => {
      Meteor.userId.returns(42)
      const error = { message: 'Something bad happenned :(' }

      process.nextTick(() => {
        input.next(inputAction)

        const {progressSubscriber} = ajaxStub.firstCall.args[0]
        progressSubscriber.next({
          lengthComputable: true,
          loaded: 4000,
          total: 10000 // 40%
        }) // Should make a progress action be sent immediately
        clock.tick(500)
        progressSubscriber.next({
          lengthComputable: true,
          loaded: 6000,
          total: 10000 // 60%
        }) // Should be bufferred but never sent as the error is sent right after, before the full 1000ms elapses
        clock.tick(100)

        ajaxStream.error(error)
        clock.tick(1200) // Making sure the buffer is flushed, but not sending any actions

        progressSubscriber.complete()
        ajaxStream.complete()
        input.complete()
      })

      output.subscribe(nextSpy, null, () => {
        expect(nextSpy).to.have.been.callCount(3)
        expect(nextSpy.firstCall).to.have.been.calledWithMatch({
          ...inputAction,
          type: ATTACHMENT_UPLOADING
        })
        expect(nextSpy.secondCall).to.have.been.calledWithMatch({
          ...inputAction,
          type: ATTACHMENT_UPLOAD_PROGRESS,
          percent: 40
        })
        expect(nextSpy.thirdCall).to.have.been.calledWithMatch({
          ...inputAction,
          type: ATTACHMENT_UPLOAD_ERROR,
          errorMessage: 'Upload failed',
          error
        })

        done()
      })
    })
  })
}
