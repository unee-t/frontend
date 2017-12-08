/* eslint-env mocha */

import { expect } from 'meteor/practicalmeteor:chai'
import { Meteor } from 'meteor/meteor'
import { factoryOptions } from './cases'

if (Meteor.isServer) {
  describe('Cases collection', () => {
    describe('RestResourceFactory options', () => {
      it('should contain a proper uriTemplate', () => {
        const resourceUri = factoryOptions.uriTemplate(3)

        expect(resourceUri).to.equal('/rest/bug/3')
      })
      it('should contain a proper dataResolver', () => {
        const data = factoryOptions.dataResolver({ bugs: ['jackpot', 2, 4, 5] })

        expect(data).to.equal('jackpot')
      })
    })
  })
}
