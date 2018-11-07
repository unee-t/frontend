/* eslint-env mocha */

import { sinon } from 'meteor/practicalmeteor:sinon'
import { expect } from 'meteor/practicalmeteor:chai'
import { Meteor } from 'meteor/meteor'
import bugzillaApi from '../../util/bugzilla-api'
import publishFactory from './rest-resource-factory'

if (Meteor.isServer) {
  describe('RestResourceFactory publication base', () => {
    it('should return an object with a publicById function factory', () => {
      const func = publishFactory({}).publishById({})

      expect(func).to.be.a('function')
    })

    describe('generated publication', () => {
      let callAPIStub, callAPIPromise, innerResolve, innerReject, usersFindOneStub
      const fakeApiKey = '3DfdHDkrjCBY554GH'
      beforeEach(() => {
        callAPIPromise = new Promise((resolve, reject) => {
          innerResolve = resolve
          innerReject = reject
        })
        callAPIStub = sinon.stub(bugzillaApi, 'callAPI').returns(callAPIPromise)
        usersFindOneStub = sinon.stub(Meteor.users, 'findOne').returns({
          bugzillaCreds: {
            apiKey: fakeApiKey
          }
        })
      })
      afterEach(() => {
        callAPIStub.restore()
        usersFindOneStub.restore()
      })
      it('should return use the "ready" and "error" triggers if the user is not authenticated, and not try to fetch the user', () => {
        const publishFunc = publishFactory({}).publishById({ uriTemplate: () => '/route' })
        const ready = sinon.spy()
        const error = sinon.spy()
        publishFunc.call({ userId: null, ready, error }, 11)

        expect(ready).to.have.been.calledOnce()
        expect(error).to.have.been.calledOnce()
        expect(usersFindOneStub).to.not.have.been.called()
        expect(callAPIStub).to.not.have.been.called()
      })
      it('should call BZ API with the uriTemplate result and with the user\'s api key', () => {
        const resourceId = 2636
        const userId = 2848
        const publishFunc = publishFactory({}).publishById({ uriTemplate: (id) => `/bla/${id}/blabla` })

        publishFunc.call(({ userId, onStop: () => {} }), resourceId)

        expect(usersFindOneStub).to.have.been.calledWithMatch({ _id: userId })
        expect(callAPIStub).to.have.been.calledWith(
          'get', `/bla/${resourceId}/blabla`, sinon.match({ api_key: fakeApiKey })
        )
      })
      it('should call the "ready" method and "added" method once after the API promise resolves, if isMulti=false', async function () {
        const context = {
          userId: 3523,
          added: sinon.spy(),
          ready: sinon.spy(),
          onStop: () => {} // TODO: make it a spy and test
        }
        const publishFunc = publishFactory({
          collectionName: 'apples',
          dataResolver: (data) => data.bla.things[3]
        }).publishById({ uriTemplate: id => `/resource/${id}` })
        const fakeApple = { description: 'Fuji', id: 111 }
        const fakePayload = {
          bla: {
            things: [null, null, null, fakeApple, null]
          }
        }

        innerResolve(fakePayload)
        await publishFunc.call(context, 111)

        expect(context.added).to.have.been.calledWithMatch('apples', 111, fakeApple)
        expect(context.added).to.have.been.calledOnce()
        expect(context.ready).to.have.been.calledOnce()
      })
      it('should call the "ready" method and "added" method with each item after the API promise resolves, if isMulti=true', async function () {
        const context = {
          userId: 2132,
          added: sinon.spy(),
          ready: sinon.spy(),
          onStop: () => {} // TODO: make it a spy and test
        }
        const publishFunc = publishFactory({
          collectionName: 'oranges',
          dataResolver: (data) => data.oranges.list
        }).publishById({ uriTemplate: id => `/resource/${id}` })
        const oranges = [
          { id: 111, size: 3 },
          { id: 222, size: 7 },
          { id: 333, size: 4 }
        ]
        const fakePayload = {
          oranges: {
            list: oranges
          }
        }

        innerResolve(fakePayload)
        await publishFunc.call(context, 123)

        expect(context.added).to.have.been.calledWithMatch('oranges', 111, oranges[0])
        expect(context.added).to.have.been.calledWithMatch('oranges', 222, oranges[1])
        expect(context.added).to.have.been.calledWithMatch('oranges', 333, oranges[2])
        expect(context.added).to.have.been.calledThrice()
        expect(context.ready).to.have.been.calledOnce()
      })
      it('should use the "ready" and "error" triggers if an API error has occurred', (done) => {
        const context = {
          userId: 2132,
          error: sinon.spy(),
          ready: sinon.spy(),
          onStop: () => {} // TODO: make it a spy and test
        }
        const publishFunc = publishFactory({}).publishById({ uriTemplate: id => `/resource/${id}` })

        innerReject()
        publishFunc.call(context, 444)

        process.nextTick(() => {
          expect(context.ready).to.have.been.calledOnce()
          expect(context.error).to.have.been.calledOnce()
          done()
        })
      })
    })

    describe('mutation handlers', () => {
      // TODO: complete testing
    })
  })
}
