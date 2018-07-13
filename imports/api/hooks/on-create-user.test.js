/* eslint-env mocha */

import { Meteor } from 'meteor/meteor'
import { HTTP } from 'meteor/http'
import bugzillaApi from '../../util/bugzilla-api'
import { sinon } from 'meteor/practicalmeteor:sinon'
import { expect } from 'meteor/practicalmeteor:chai'
import { onCreateUser } from './on-create-user'

if (Meteor.isServer) {
  describe('Accounts.onCreateUser hook', () => {
    const fakeEmail = 'bla@example.com'
    let callAPIStub, origApiEnrollUrl, origApiAccessToken
    before(() => {
      origApiEnrollUrl = process.env.APIENROLL_LAMBDA_URL
      process.env.APIENROLL_LAMBDA_URL = 'http://something/asdsa'
      origApiAccessToken = process.env.API_ACCESS_TOKEN
      process.env.API_ACCESS_TOKEN = 'abc123'
    })
    beforeEach(() => {
      callAPIStub = sinon.stub(bugzillaApi, 'callAPI')
      sinon.stub(HTTP, 'call')
    })
    afterEach(() => {
      callAPIStub.restore()
      HTTP.call.restore()
    })
    after(() => {
      process.env.APIENROLL_LAMBDA_URL = origApiEnrollUrl
      process.env.API_ACCESS_TOKEN = origApiAccessToken
    })
    describe('With no Bugzilla credentials', () => {
      it('should call "callAPI" with "POST /rest/user" and throw an error if it throws', () => {
        callAPIStub.throws()

        const boundFunc = onCreateUser.bind(null, {email: fakeEmail, profile: {}}, {})

        expect(boundFunc).to.throw()
        expect(callAPIStub).to.have.been.calledWith(
          'post', '/rest/user', sinon.match({ email: fakeEmail, password: sinon.match.string }), true, true
        )
      })
      it('should do an http request "POST (apienroll API)" and throw an error if it throws', () => {
        callAPIStub.returns({ data: {id: 2626} })
        HTTP.call.throws()

        const boundFunc = onCreateUser.bind(null, {email: fakeEmail, profile: {}}, {})

        expect(boundFunc).to.throw()
        expect(callAPIStub).to.have.been.calledOnce()
        expect(HTTP.call).to.have.been.calledWith(
          'POST', process.env.APIENROLL_LAMBDA_URL, sinon.match({
            data: sinon.match({
              userId: '2626',
              userApiKey: sinon.match.string
            }),
            headers: sinon.match({
              Authorization: `Bearer ${process.env.API_ACCESS_TOKEN}`
            })
          })
        )
      })
    })

    it('should return a customized user that contains the BZ credentials, id and apiKey', () => {
      const acceptedAt = new Date()
      const version = '08/06/2018'
      const fakeId = 1337
      const fakeProfile = {
        someInfo: 'bla'
      }
      const fakeUser = {
        age: 99999,
        tac: {
          acceptedAt: acceptedAt,
          version: version
        }
      }
      const fakeOptions = {
        email: fakeEmail,
        profile: fakeProfile
      }
      callAPIStub.returns({ data: { id: fakeId } })
      HTTP.call.returns()

      const customizedUser = onCreateUser(fakeOptions, fakeUser)

      expect(customizedUser).to.deep.include({
        profile: fakeProfile,
        age: 99999
      })
      expect(customizedUser.bugzillaCreds).to.deep.include({
        login: fakeEmail,
        id: fakeId
      })

      expect(customizedUser.tac).to.deep.include({
        acceptedAt: acceptedAt,
        version: version
      })
      expect(customizedUser.bugzillaCreds.password).to.be.a('string')
      expect(customizedUser.bugzillaCreds.apiKey).to.be.a('string')

      // NOTE: This is kept for reference to show how the assertion would look like if the syntax wasn't so clunky
      // expect(customizedUser).to.deep.equal({
      //   age: 99999,
      //   bugzillaCreds: {
      //     login: fakeEmail,
      //     password: String,
      //     id: fakeId,
      //     apiKey: String
      //   },
      //   profile: fakeProfile
      // })
    })

    describe('Existing BZ user handling', () => {
      it('should call "callAPI" with "GET /rest/login" and throw an error if it throws', () => {
        callAPIStub.throws()
        const bzLogin = 'bla'
        const bzPass = 'bla bla'

        const boundFunc = onCreateUser.bind(null, {email: fakeEmail, profile: {bzLogin, bzPass}}, {})

        expect(boundFunc).to.throw()
        expect(callAPIStub).to.have.been.calledWith(
          'get', '/rest/login', sinon.match({ login: bzLogin, password: bzPass }), false, true
        )
      })
      it('should do an http request "POST (apienroll API)" and throw an error if it throws', () => {
        callAPIStub.returns({ data: {id: 3232} })
        HTTP.call.throws()
        const bzLogin = 'bla'
        const bzPass = 'bla bla'

        const boundFunc = onCreateUser.bind(null, {email: fakeEmail, profile: {bzLogin, bzPass}}, {})

        expect(boundFunc).to.throw()
        expect(callAPIStub).to.have.been.calledOnce()
        expect(HTTP.call).to.have.been.calledWith(
          'POST', process.env.APIENROLL_LAMBDA_URL, sinon.match({
            data: sinon.match({
              userId: '3232',
              userApiKey: sinon.match.string
            }),
            headers: sinon.match({
              Authorization: `Bearer ${process.env.API_ACCESS_TOKEN}`
            })
          })
        )
      })

      it('should not store the password on the bugzillaCreds object if bzLogin and bzPass are provided', () => {
        const bzLogin = 'bla'
        const bzPass = 'bla bla'
        const fakeId = 1337
        callAPIStub.returns({ data: { id: fakeId } })
        HTTP.call.returns()

        const boundFunc = onCreateUser.bind(null, {email: fakeEmail, profile: {bzLogin, bzPass}}, {})
        const customizedUser = boundFunc()

        expect(customizedUser.bugzillaCreds.password).to.not.be.ok()
        expect(customizedUser.bugzillaCreds.apiKey).to.be.a('string')
        expect(customizedUser.profile).to.not.have.keys('bzLogin', 'bzPass')
      })
    })
  })
}
