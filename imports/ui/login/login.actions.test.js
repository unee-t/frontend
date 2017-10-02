/* eslint-env mocha */

import { expect } from 'meteor/practicalmeteor:chai'
import { Meteor } from 'meteor/meteor'
import { submitCredentials, LOGIN_PROCESS, LOGIN_ERROR } from './login.actions'
import { sinon } from 'meteor/practicalmeteor:sinon'
import routerRedux from 'react-router-redux'

if (Meteor.isClient) {
  describe('Login page actions', () => {
    describe('submitCredentials', () => {
      const fakes = {
        email: 'ytb@asdk.com',
        password: '553SA434dsd#@sd!@#'
      }

      it('should return a thunk action function', () => {
        const action = submitCredentials(fakes.email, fakes.password)
        expect(action).to.be.a('function')
      })
      describe('Action function dispatch', () => {
        let dispatchStub, pushControlStub, pushStub
        beforeEach(() => {
          dispatchStub = sinon.stub()
          sinon.stub(Meteor, 'loginWithPassword')
          // Stubbing "push" is a bit complicated since it's a ridiculous fancy getter that's hard to stub
          pushStub = sinon.stub()
          pushControlStub = sinon.stub(routerRedux, 'push', { get: () => pushStub })
        })
        afterEach(() => {
          Meteor.loginWithPassword.restore()
          pushControlStub.restore()
        })
        it('should dispatch "process" action immediately and call the meteor login API', () => {
          const action = submitCredentials(fakes.email, fakes.password)
          action(dispatchStub)

          expect(dispatchStub).to.have.been.calledWithMatch({type: LOGIN_PROCESS})
          expect(Meteor.loginWithPassword).to.have.been.calledWith(fakes.email, fakes.password, sinon.match.func)
        })
        it('should dispatch an "error" action if the Meteor API yields an error', () => {
          const someError = 'some error'
          Meteor.loginWithPassword.yields(someError)

          const action = submitCredentials(fakes.email, fakes.password)
          action(dispatchStub)

          expect(dispatchStub).to.have.been.calledTwice()
          expect(dispatchStub.secondCall).to.have.been.calledWithMatch({
            type: LOGIN_ERROR,
            value: someError
          })
        })
        it('should dispatch a navigation action to "/unit/new" if the API yields with no error', () => {
          const mockAction = { fake: true }
          Meteor.loginWithPassword.yields()
          pushStub.returns(mockAction)

          const action = submitCredentials(fakes.email, fakes.password)
          action(dispatchStub)

          expect(pushStub).to.have.been.calledWith('/unit/new')
          expect(dispatchStub).to.have.been.calledTwice()
          expect(dispatchStub.secondCall).to.have.been.calledWith(mockAction)
        })
      })
    })
  })
}
