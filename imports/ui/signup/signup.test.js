/* eslint-env mocha */

import React from 'react'
import { shallow } from 'enzyme'
import { expect } from 'meteor/practicalmeteor:chai'
import { SignupPage } from './signup.jsx'
import { Meteor } from 'meteor/meteor'
import actions from './signup.actions'
import { sinon } from 'meteor/practicalmeteor:sinon'

if (Meteor.isClient) {
  describe('Signup page', () => {
    it('should render successfully', () => {
      const signup = shallow(<SignupPage />)
      expect(signup.find('form')).to.have.lengthOf(1)
    })

    describe('Form submission', () => {
      let mockAction
      before(() => {
        mockAction = { bla: 'bla' }
        sinon.stub(actions, 'submitSignupInfo').returns(mockAction)
      })
      after(() => {
        actions.submitSignupInfo.restore()
      })
      it('should create a submit action and dispatch it, when the form is submitted', () => {
        const dispatchStub = sinon.stub()
        const signup = shallow(<SignupPage dispatch={dispatchStub} />)
        const formData = {
          fullName: 'test testminson',
          phoneNumber: '99991929',
          country: 'testolandia',
          emailAddress: 'tst@testsonian.tes',
          password: '5up34C0mp1cat3d'
        }
        // Filling out form data
        signup.instance().info = Object.keys(formData).reduce((all, curr) => {
          all[curr] = { value: formData[curr] }
          return all
        }, {})

        signup.find('form').simulate('submit', { preventDefault: () => {} })
        expect(actions.submitSignupInfo).to.have.been.calledWithMatch(formData)
        expect(dispatchStub).to.have.been.calledWith(mockAction)
      })
    })
  })
}
