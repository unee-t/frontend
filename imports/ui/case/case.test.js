/* eslint-env mocha */

import React from 'react'
import { shallow } from 'enzyme'
import { Meteor } from 'meteor/meteor'
import { expect } from 'meteor/practicalmeteor:chai'

if (Meteor.isClient) {
  describe('Case details screen component', () => {
    let Case
    const findLabel = (comp, labelText) => comp.findWhere(n => n.children().length === 0 && n.text() === labelText)

    before(() => {
      return Promise.all([import('./case.jsx'), import('./case.mss')]).then(([module]) => {
        Case = module.Case
      })
    })

    it('should render the preloader if the case is being loaded', () => {
      const comp = shallow(<Case loadingCase />)

      expect(comp.find('Preloader')).to.have.lengthOf(1)
    })

    it('should render an error message that resulted from loading the case', () => {
      const message = 'Some error occurred'
      const error = {
        error: {message}
      }
      const comp = shallow(<Case caseError={error} />)

      expect(findLabel(comp, message)).to.have.lengthOf(1)
    })
  })
}
