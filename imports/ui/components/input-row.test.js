/* eslint-env mocha */

import React from 'react'
import { shallow } from 'enzyme'
import { expect } from 'meteor/practicalmeteor:chai'
import InputRow from './input-row.jsx'
import { Meteor } from 'meteor/meteor'

if (Meteor.isClient) {
  describe('InputRow', () => {
    it('should render appropriately for the required props', () => {
      const row = shallow(<InputRow label='test' identifier='test-ident' />)
      // Checking the label fits
      expect(row.find('label').text()).to.equal('test')
      const inputEl = row.find('input')
      // Checking the name and id attributes fit
      expect(inputEl.props().name).to.equal('test-ident')
      expect(inputEl.props().id).to.equal('test-ident')
    })

    it('should render additional classes on the input element, if specified', () => {
      const row = shallow(<InputRow label='bla' identifier='bla1' inpAdditionalClass='class-test abc123' />)
      const inputEl = row.find('input')
      expect(inputEl.props().className).to.match(/[\s^]class-test\s/)
      expect(inputEl.props().className).to.match(/\sabc123($|\s)/)
    })

    it('should render the input element with the specified placeholder text', () => {
      const row = shallow(<InputRow label='bla' identifier='bla1' placeholder='dummy placeholder' />)
      expect(row.find('input').props().placeholder).to.equal('dummy placeholder')
    })

    describe('inpType', () => {
      it('should set the type of the input as text if not specified', () => {
        const row = shallow(<InputRow label='bla' identifier='bla1' />)
        expect(row.find('input').props().type).to.equal('text')
      })

      it('should pass the value set to inpType as the input type', () => {
        const row = shallow(<InputRow label='bla' identifier='bla1' inpType='number' />)
        expect(row.find('input').props().type).to.equal('number')
      })
    })
  })
}
