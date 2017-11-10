/* eslint-env mocha */

import { sinon } from 'meteor/practicalmeteor:sinon'
import { expect } from 'meteor/practicalmeteor:chai'
import { Meteor } from 'meteor/meteor'
import bugzillaApi from '../util/bugzilla-api'
import { publishClaim } from './claims'

if (Meteor.isServer) {
  describe('Claims collection', () => {
    describe('"claim" publication', () => {
      let callAPIStub, callAPIPromise, innerResolve, usersFindOneStub
      const fakeToken = '3DfdHDkrjCBY554GH'
      beforeEach(() => {
        callAPIPromise = new Promise((resolve) => {
          innerResolve = resolve
        })
        callAPIStub = sinon.stub(bugzillaApi, 'callAPI').returns(callAPIPromise)
        usersFindOneStub = sinon.stub(Meteor.users, 'findOne').returns({
          bugzillaCreds: {
            token: fakeToken
          }
        })
      })
      afterEach(() => {
        callAPIStub.restore()
        usersFindOneStub.restore()
      })
      it('should return undefined if the user is not authenticated, and not try to fetch the user', () => {
        const returnVal = publishClaim.call({ userId: null }, 11)

        expect(returnVal).to.be.undefined()
        expect(usersFindOneStub).to.not.have.been.called()
        expect(callAPIStub).to.not.have.been.called()
      })
      it('should call BZ API at "GET /rest/bug/:claimId" with the user\'s API token', () => {
        const claimId = 2636
        const userId = 2848

        publishClaim.call({ userId }, claimId)

        expect(usersFindOneStub).to.have.been.calledWithMatch({ _id: userId })
        expect(callAPIStub).to.have.been.calledWith('get', `/rest/bug/${claimId}`, sinon.match({ token: fakeToken }))
      })
      it('should call the "added" and "ready" methods if the API promise resolves', () => {
        const context = {
          userId: 3523,
          added: sinon.spy(),
          ready: sinon.spy()
        }
        const fakeBug = { description: 'broken toilet' }

        publishClaim.call(context, 111)
        innerResolve({ bugs: [fakeBug] })

        return callAPIPromise.then(() => {
          expect(context.added).to.have.been.calledWith('claims', 111, fakeBug)
          expect(context.ready).to.have.been.calledOnce()
        })
      })
    })
  })
}
