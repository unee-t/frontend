/* eslint-env mocha */

import { Meteor } from 'meteor/meteor'
import bugzillaApi from '../../util/bugzilla-api'
import { sinon } from 'meteor/practicalmeteor:sinon'
import { expect } from 'meteor/practicalmeteor:chai'
import { onCreateUser } from './on-create-user'

if (Meteor.isServer) {
  describe('Accounts.onCreateUser hook', () => {
    const fakeEmail = 'bla@example.com'
    let callAPIStub
    beforeEach(() => {
      callAPIStub = sinon.stub(bugzillaApi, 'callAPI')
    })
    afterEach(() => {
      callAPIStub.restore()
    })
    it('should call "callAPI" with "POST /rest/user" and the right arguments and throw an error if it throws', () => {
      callAPIStub.throws()

      const boundFunc = onCreateUser.bind(null, {email: fakeEmail, profile: {}}, {})

      expect(boundFunc).to.throw()
      expect(callAPIStub).to.have.been.calledWith('post', '/rest/user', sinon.match({ email: fakeEmail, password: sinon.match.string }), true, true)
    })
    it('should "callAPI" with "GET /rest/login" for the second time and throw an error if it throws', () => {
      callAPIStub.onFirstCall().returns({ data: {} })
      callAPIStub.onSecondCall().throws()

      const boundFunc = onCreateUser.bind(null, {email: fakeEmail, profile: {}}, {})

      expect(boundFunc).to.throw()
      expect(callAPIStub).to.have.been.calledTwice()
      expect(callAPIStub).to.have.been.calledWith('get', '/rest/login', sinon.match({ login: fakeEmail, password: sinon.match.string }), false, true)
    })
    it('should return a customized user that contains the BZ credentials, id and token', () => {
      const fakeId = 1337
      const fakeToken = '453dDFs4SDsds9G'
      const fakeProfile = {
        someInfo: 'bla'
      }
      const fakeUser = {
        age: 99999
      }
      const fakeOptions = {
        email: fakeEmail,
        profile: fakeProfile
      }
      callAPIStub.onFirstCall().returns({ data: { id: fakeId } })
      callAPIStub.onSecondCall().returns({ data: { token: fakeToken, id: fakeId } })

      const customizedUser = onCreateUser(fakeOptions, fakeUser)

      expect(customizedUser).to.deep.include({
        profile: fakeProfile,
        age: 99999
      })
      expect(customizedUser.bugzillaCreds).to.deep.include({
        login: fakeEmail,
        id: fakeId,
        token: fakeToken
      })
      expect(customizedUser.bugzillaCreds.password).to.be.a('string')

      // NOTE: This is kept for reference to show how the assertion would look like if the syntax wasn't so clunky
      // expect(customizedUser).to.deep.equal({
      //   age: 99999,
      //   bugzillaCreds: {
      //     login: fakeEmail,
      //     password: String,
      //     id: fakeId,
      //     token: fakeToken
      //   },
      //   profile: fakeProfile
      // })
    })

    describe('Existing BZ user handling', () => {
      it('should skip creating a new user if bzLogin and bzPass are provided', () => {
        callAPIStub.throws()
        const bzLogin = 'bla'
        const bzPass = 'bla bla'

        const boundFunc = onCreateUser.bind(null, {email: fakeEmail, profile: {bzLogin, bzPass}}, {})

        expect(boundFunc).to.throw()
        expect(callAPIStub).to.have.been.calledOnce()
        expect(callAPIStub).to.have.been.calledWith('get', '/rest/login', sinon.match({ login: bzLogin, password: sinon.match.string }), false, true)
      })

      it('should not store the password on the bugzillaCreds object if bzLogin and bzPass are provided', () => {
        const bzLogin = 'bla'
        const bzPass = 'bla bla'
        const fakeId = 1337
        const fakeToken = '453dDFs4SDsds9G'
        callAPIStub.returns({ data: { token: fakeToken, id: fakeId } })

        const boundFunc = onCreateUser.bind(null, {email: fakeEmail, profile: {bzLogin, bzPass}}, {})
        const customizedUser = boundFunc()

        expect(customizedUser.bugzillaCreds.password).to.not.be.ok()
        expect(customizedUser.profile).to.not.have.keys('bzLogin', 'bzPass')
      })
    })
  })
}
