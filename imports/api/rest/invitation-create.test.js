/* eslint-env mocha */

import { Meteor } from 'meteor/meteor'
import { sinon } from 'meteor/practicalmeteor:sinon'
import { expect } from 'meteor/practicalmeteor:chai'
import invitationCreate from './invitation-create'
import inviteUserUtil from '../../util/user-invitation'

if (Meteor.isServer) {
  describe('InvitationCreate json route', () => {
    beforeEach(() => {
      sinon.stub(inviteUserUtil, 'inviteUser')
    })
    afterEach(() => {
      inviteUserUtil.inviteUser.restore()
    })
    it('should call "inviteUser" with the params from body, and "res.send" with a success message', () => {
      const sendSpy = sinon.spy()
      const body = {
        email: 'a@example.com',
        claimId: 333,
        unitId: 444,
        role: 'patrol'
      }

      invitationCreate({ body }, { send: sendSpy })

      expect(inviteUserUtil.inviteUser).to.have.been.calledWith(body.email, body.claimId, body.unitId, body.role)
      expect(sendSpy).to.have.been.calledOnce()
      expect(sendSpy).to.have.been.calledWith(sinon.match.string)
    })
  })
}
