/* eslint-env mocha */

import { expect } from 'meteor/practicalmeteor:chai'
import { Meteor } from 'meteor/meteor'
import { submitSignupInfo } from './signup.actions'
import { sinon } from 'meteor/practicalmeteor:sinon'
import { Accounts } from 'meteor/accounts-base'
import routerRedux from 'react-router-redux'

if (Meteor.isClient) {
  describe('Signup page actions', () => {
    describe('submitSignupInfo', () => {
      const makeFakeInfo = () => ({
        emailAddress: 'ytb@example.org',
        password: '553SA434dsd#@sd!@#',
        phoneNumber: '31288292',
        fullName: 'Kanye West',
        country: 'Singapore'
      })

      it('should return a thunk action function', () => {
        const action = submitSignupInfo(makeFakeInfo())
        expect(action).to.be.a('function')
      })

      describe('Action function dispatch', () => {
        let dispatchStub, pushStub, pushControlStub, info
        beforeEach(() => {
          sinon.stub(Accounts, 'createUser')
          dispatchStub = sinon.stub()
          pushStub = sinon.stub()
          pushControlStub = sinon.stub(routerRedux, 'push', { get: () => pushStub })
          info = makeFakeInfo()
        })
        afterEach(() => {
          Accounts.createUser.restore()
          pushControlStub.restore()
        })
        it('should call Meteor\'s createUser API', () => {
          const action = submitSignupInfo(info)
          action(dispatchStub)

          expect(Accounts.createUser).to.have.been.calledWithMatch({
            email: info.emailAddress,
            password: info.password,
            profile: {
              phone: info.phoneNumber,
              name: info.fullName,
              country: info.country
            }
          })
        })
        // Needs implementation and testing
        it.skip('should dispatch "error" if the API yields an error', () => {})
        it('should dispatch a navigation event to "/unit/new" if the API call is successful', () => {
          const mockAction = { fake: true }
          Accounts.createUser.yields()
          pushStub.returns(mockAction)

          const action = submitSignupInfo(info)
          action(dispatchStub)

          expect(pushStub).to.have.been.calledWith('/unit/new')
          expect(dispatchStub).to.have.been.calledWith(mockAction)
        })
      })
    })
  })
}
