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

    it('should render the preloader if the comments are being loaded', () => {
      const comp = shallow(<Case loadingComments />)

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

    it('should render the main sub-route after all data has been loaded', () => {
      const comp = shallow(
        <Case userBzLogin='a@example.com' comments={[]} attachmentUploads={[]} caseItem={{}}
          match={{url: '/bla', params: {caseId: 41}}} />
      )

      expect(comp.find('Route').findWhere(route => route.props().path === '/bla')).to.have.length(1)
    })

    it('should render the attachment viewer sub-route after all data has been loaded', () => {
      const comp = shallow(
        <Case userEmail='a@example.com' comments={[]} attachmentUploads={[]} caseItem={{}}
          match={{url: '/bla/32', params: {caseId: 41}}} />
      )

      expect(comp.find('Route').findWhere(route => route.props().path === '/bla/32/attachment/:attachId')).to.have.length(1)
    })

    it('should redirect to the main sub-route if no match is found after all data has been loaded', () => {
      const comp = shallow(
        <Case userBzLogin='a@example.com' comments={[]} attachmentUploads={[]} caseItem={{}}
          match={{url: '/bla/32', params: {caseId: 41}}} />
      )

      expect(comp.find('Switch Redirect').props().to).to.equal('/bla/32')
    })

    // TODO: test the render functions of the sub-routes
  })
}
