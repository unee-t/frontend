/* eslint-env mocha */

import React from 'react'
import { shallow, mount } from 'enzyme'
import { expect } from 'meteor/practicalmeteor:chai'
import { UnitCreate, userRoles } from './unit-create.jsx'
import { Meteor } from 'meteor/meteor'
import actions from './unit-create.actions'
import { sinon } from 'meteor/practicalmeteor:sinon'

if (Meteor.isClient) {
  describe('Unit Creation Page', () => {
    it('should render successfully', () => {
      const unitCreate = shallow(<UnitCreate />)
      expect(unitCreate.find('form')).to.have.lengthOf(1)
    })
    it('should render an option for every possible role', () => {
      const unitCreate = shallow(<UnitCreate />)
      const options = unitCreate.find('select').children()
      userRoles.forEach(role => {
        const matching = options.findWhere(opt => {
          return opt.node === role
        })
        expect(matching).to.have.a.lengthOf(1)
      })
    })

    describe('Unit creation', () => {
      let mockAction
      beforeEach(() => {
        mockAction = { bla: 'bla' }
        sinon.stub(actions, 'createAndNext').returns(mockAction)
        sinon.stub(actions, 'createAndMore').returns(mockAction)
      })
      afterEach(() => {
        actions.createAndNext.restore()
        actions.createAndMore.restore()
      })
      it('should create a createAndNext action and dispatch it, when the appropriate button is clicked', () => {
        const dispatchStub = sinon.stub()
        const unitCreate = mount(<UnitCreate dispatch={dispatchStub} />)
        // Filling out form data
        const data = {
          unitName: '11 Wilkinson Rd',
          userRole: 'Tenant',
          isOccupant: true
        }
        const inputs = unitCreate.instance().inputs
        inputs.unitName.value = data.unitName
        inputs.userRole.value = data.userRole
        inputs.isOccupant.checked = data.isOccupant

        Object.keys(inputs).forEach(key => {
          const input = inputs[key]
          unitCreate.find(`[name="${input.name}"]`).simulate('change')
        })

        unitCreate.ref('saveAndNextButton').simulate('click')
        expect(actions.createAndNext).to.have.been.calledWithMatch(data.unitName, data.userRole, data.isOccupant)
        expect(dispatchStub).to.have.been.calledWith(mockAction)
      })
      it('should create a createAndMore action and dispatch it, when the appropriate button is clicked', () => {
        const dispatchStub = sinon.stub()
        const unitCreate = mount(<UnitCreate dispatch={dispatchStub} />)
        // Filling out form data
        const data = {
          unitName: '141 Patleron St',
          userRole: 'Agent',
          isOccupant: false
        }
        const inputs = unitCreate.instance().inputs
        inputs.unitName.value = data.unitName
        inputs.userRole.value = data.userRole
        inputs.isOccupant.checked = data.isOccupant

        Object.keys(inputs).forEach(key => {
          const input = inputs[key]
          unitCreate.find(`[name="${input.name}"]`).simulate('change')
        })

        unitCreate.ref('addMoreDetailsButton').simulate('click')
        expect(actions.createAndMore).to.have.been.calledWithMatch(data.unitName, data.userRole, data.isOccupant)
        expect(dispatchStub).to.have.been.calledWith(mockAction)
      })
    })
  })
}
