/* eslint-env mocha */

import React from 'react'
import { mount } from 'enzyme'
import { expect } from 'meteor/practicalmeteor:chai'
import PasswordInput from './password-input.jsx'
import { Meteor } from 'meteor/meteor'

if (Meteor.isClient) {
  xdescribe('PasswordInput', () => {
    let passInp
    beforeEach(() => {
      passInp = mount(<PasswordInput inpRef={() => {}} />)
    })

    it('should render with the required props', () => {
      expect(passInp.find('label')).to.have.lengthOf(2)
      expect(passInp.find('input[type="checkbox"]')).to.have.lengthOf(1)
      expect(passInp.find('input[name="password"]')).to.have.lengthOf(1)
    })

    describe('Type switching', () => {
      it('should render the input as "password" by default', () => {
        expect(passInp.find('input[name="password"]').props().type).to.equal('password')
      })

      it('should switch the main input to "text" after clicking the checkbox', () => {
        passInp.find('input[type="checkbox"]').simulate('change')
        expect(passInp.find('input[name="password"]').props().type).to.equal('text')
      })

      it('should switch the main input back to "password" after clicking the checkbox again', () => {
        passInp.find('input[type="checkbox"]').simulate('change')
        passInp.find('input[type="checkbox"]').simulate('change')
        expect(passInp.find('input[name="password"]').props().type).to.equal('password')
      })
    })
  })
}
