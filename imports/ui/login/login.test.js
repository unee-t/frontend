/* eslint-env mocha */

import React from 'react'
import { shallow } from 'enzyme'
import { expect } from 'meteor/practicalmeteor:chai'
import { LoginPage } from './login.jsx'
import { Meteor } from 'meteor/meteor'
import actions from './login.actions'
import { sinon } from 'meteor/practicalmeteor:sinon'

if (Meteor.isClient) {
  xdescribe('Login page', () => {
    it('should render successfully', () => {
      const login = shallow(<LoginPage />)
      expect(login.find('form')).to.have.lengthOf(1)
    })

    describe('Form submission', () => {
      const mockAction = { bla: 'bla' }
      before(() => {
        sinon.stub(actions, 'submitCredentials').returns(mockAction)
      })
      after(() => {
        actions.submitCredentials.restore()
      })
      it('should create and dispatch the submitCredentials action when the form is submitted', () => {
        const dispatchStub = sinon.stub()
        const login = shallow(<LoginPage dispatch={dispatchStub} />)
        const userEmail = 'bla@bla.com'
        const userPass = 's1kr1tttt'
        // Filling out form data
        login.instance().emailInput = { value: userEmail }
        login.instance().passInput = { value: userPass }
        const mockEvent = { preventDefault: () => {} }
        login.find('form').simulate('submit', mockEvent)

        expect(actions.submitCredentials).to.have.been.calledWith(userEmail, userPass)
        expect(dispatchStub).to.have.been.calledWith(mockAction)
      })
    })

    describe('Error handling', () => {
      it('should not render an error message if the error isn\'t sent', () => {
        const login = shallow(<LoginPage />)
        const errorNode = login.findWhere(n => n.children().length === 0 && n.text() === 'Email or password do not match')
        expect(errorNode).to.have.lengthOf(0)
      })

      it('should render an error message if the error is provided', () => {
        const login = shallow(<LoginPage showLoginError='This is the error' />)
        const errorNode = login.findWhere(n => n.children().length === 0 && n.text() === 'Email or password do not match')
        expect(errorNode).to.have.lengthOf(1)
      })
    })
  })
}
