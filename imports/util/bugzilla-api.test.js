/* eslint-env mocha */

import { HTTP } from 'meteor/http'
import { Meteor } from 'meteor/meteor'
import { sinon } from 'meteor/practicalmeteor:sinon'
import { expect } from 'meteor/practicalmeteor:chai'
import { callAPI } from './bugzilla-api'

if (Meteor.isServer) {
  describe('bugzilla-api Util', () => {
    const base = process.env.BUGZILLA_URL || 'http://localhost:8081'
    let origBugzillaUrl, origBugzillaKey
    beforeEach(() => {
      sinon.stub(HTTP, 'call')
      origBugzillaUrl = process.env.BUGZILLA_URL
      origBugzillaKey = process.env.BUGZILLA_ADMIN_KEY
    })
    afterEach(() => {
      HTTP.call.restore()
      if (origBugzillaUrl) {
        process.env.BUGZILLA_URL = origBugzillaUrl
      } else {
        delete process.env.BUGZILLA_URL
      }
      if (origBugzillaKey) {
        process.env.BUGZILLA_ADMIN_KEY = origBugzillaKey
      } else {
        delete process.env.BUGZILLA_ADMIN_KEY
      }
    })
    it('should call HTTP.call with the appropriate method and params, when using GET', () => {
      const params = {param1: 1}
      callAPI('get', '/some-route', params)

      expect(HTTP.call).to.have.been.calledWith('get', `${base}/some-route`, sinon.match({params: params}), sinon.match.func)
    })
    it('should call HTTP.call with the appropriate method and params, when using anything other than GET', () => {
      const params = {param1: 1}
      callAPI('post', '/dummy', params)

      expect(HTTP.call).to.have.been.calledWith('post', `${base}/dummy`, sinon.match({data: params}), sinon.match.func)
    })
    it('should use the bugzilla server path from the env var, if specified', () => {
      process.env.BUGZILLA_URL = 'https://bla.bugzilla.unee-t.net'
      callAPI('get', '/dummy', {})

      expect(HTTP.call).to.have.been.calledWith(sinon.match.string, 'https://bla.bugzilla.unee-t.net/dummy', sinon.match.object, sinon.match.func)
    })
    it('should send the bugzilla API key via the options param, by reading it from the env vars, if "isAdmin" is sent as true', () => {
      process.env.BUGZILLA_ADMIN_KEY = 'someDummyKeyExample'

      callAPI('get', '/dummy', {}, true)

      expect(HTTP.call).to.have.been.calledWith(sinon.match.string, sinon.match.string, sinon.match({params: {api_key: 'someDummyKeyExample'}}), sinon.match.func)
    })
    it('should not call HTTP.call with a callback function, if "isSync" is set to true', () => {
      callAPI('get', '/dummy', {}, false, true)

      expect(HTTP.call).to.have.been.calledWith(sinon.match.string, sinon.match.string, sinon.match.object, sinon.match.falsy)
    })
    it('should return a promise by default', () => {
      const returnVal = callAPI('get', '/dummy', {})

      expect(returnVal).to.be.instanceOf(Promise)
    })
    it('should return a the return value of HTTP.call if "isSync" is set to true', () => {
      HTTP.call.returns('response value')
      const returnVal = callAPI('get', '/dummy', {}, false, true)

      expect(returnVal).to.be.equal('response value')
    })

    describe('async response handling', () => {
      it('should reject the returned promise if HTTP.call yields an error', async function (done) {
        HTTP.call.yields(new Error('dummy'))

        try {
          await callAPI('get', '/dummy', {})

          done('The error should have been caught')
        } catch (e) {
          done()
        }
      })

      it('should resolve the returned promise if HTTP.call yields a value', async function (done) {
        HTTP.call.yields(null, {data: 'response'})

        try {
          const result = await callAPI('get', '/dummy', {})

          expect(result).to.equal('response')
          done()
        } catch (e) {
          done(e)
        }
      })
    })
  })
}
