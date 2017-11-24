/* eslint-env mocha */

import { expect } from 'meteor/practicalmeteor:chai'
import { Meteor } from 'meteor/meteor'
import { factoryOptions } from './comments'

if (Meteor.isServer) {
  describe('Comments collection', () => {
    describe('RestResourceFactory options', () => {
      it('should contain a proper uriTemplate', () => {
        const resourceUri = factoryOptions.uriTemplate(77)

        expect(resourceUri).to.equal('/rest/bug/77/comment')
      })
      it('should contain a proper dataResolver', () => {
        const data = factoryOptions.dataResolver({
          bugs: {
            '52': {
              comments: [1, 2, 3],
              id: 52
            },
            '42': {
              comments: [4, 5, 6],
              id: 42
            },
            '99': {
              comments: [7, 8, 9],
              id: 99
            }
          }
        }, 42)

        expect(data).to.deep.equal([4, 5, 6])
      })
    })
  })
}
