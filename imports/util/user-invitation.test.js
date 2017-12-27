/* eslint-env mocha */

import { Meteor } from 'meteor/meteor'
import { sinon } from 'meteor/practicalmeteor:sinon'
import { expect } from 'meteor/practicalmeteor:chai'
import { Random } from 'meteor/random'
import { Accounts } from 'meteor/accounts-base'
import { inviteUser } from './user-invitation'

if (Meteor.isServer) {
  describe('user-invitation util', () => {
    beforeEach(() => {
      sinon.stub(Accounts, 'createUser')
      sinon.stub(Accounts, 'findUserByEmail')
      sinon.stub(Accounts, 'sendEnrollmentEmail')
    })
    afterEach(() => {
      Accounts.createUser.restore()
      Accounts.findUserByEmail.restore()
      Accounts.sendEnrollmentEmail.restore()
    })
    it('should call "createUser", "findUserByEmail" and "sendEnrollmentEmail" with the proper params', () => {
      const email = 'bla1@example.com'
      const caseId = 490
      const unitId = 1102
      const role = 'troll'
      const createdUser = {
        _id: Random.id()
      }
      Accounts.findUserByEmail.returns(createdUser)

      inviteUser(email, caseId, unitId, role)

      expect(Accounts.createUser).to.have.been.calledWithMatch({
        email,
        profile: {
          invitedToCase: {
            caseId,
            unitId,
            role
          }
        }
      })
      expect(Accounts.findUserByEmail).to.have.been.calledWith(email)
      expect(Accounts.sendEnrollmentEmail).to.have.been.calledWith(createdUser._id)
    })
  })
}
