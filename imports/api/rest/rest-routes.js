/* global JsonRoutes */
import { json } from 'body-parser'
import getPendingInvitations from './get-pending-invitations'
import putPendingInvitations from './put-pending-invitations'
import getInvitations from './get-invitations'
import getConvertedInvitations from './get-converted-invitations'
import postProcessDbChangeMessage from './post-process-db-change-message'
import postSesNotification from './post-ses-notification'
import getPdfDownload from './get-pdf-download'
import postProcessApiPayloadRequest from './post-process-api-payload-request'
import getUnits from './get-units'
import getCases from './cases/get-cases'
import getCase from './cases/get-case'
import postCases from './cases/post-cases'
import postComment from './post-comment'
import putCase from './cases/put-case'
import postOtpToken from './post-otp-token'

JsonRoutes.Middleware.use(json())
JsonRoutes.Middleware.use((req, res, next) => {
  // The response objects are missing the traditional "send" method by default, so it has to be created artificially
  res.send = (code, data, headers = {}) => {
    if (typeof code !== 'number') {
      data = code
      code = 200
    }
    JsonRoutes.sendResult(res, { data, code, headers })
  }
  next()
})

const apiBase = '/api'
const createRoute = (method, url, handler) => {
  JsonRoutes.add(method, apiBase + url, handler)
}

const notFoundRoute = (req, res) => {
  res.send(400, 'no resource is associated with the specified route')
}

createRoute('get', '/pending-invitations', getPendingInvitations)
createRoute('get', '/invitations', getInvitations)
createRoute('get', '/converted-invitations', getConvertedInvitations)
createRoute('put', '/pending-invitations/done', putPendingInvitations)
createRoute('post', '/db-change-message/process', postProcessDbChangeMessage)
createRoute('post', '/ses', postSesNotification)
createRoute('get', '/report-pdf-download', getPdfDownload)
createRoute('get', '/units', getUnits)
createRoute('get', '/cases/:id', getCase)
createRoute('get', '/cases', getCases)
createRoute('post', '/cases', postCases)
createRoute('put', '/cases/:id', putCase)
createRoute('post', '/cases/:caseId/comments', postComment)
createRoute('post', '/otp-token', postOtpToken)
createRoute('post', '/process-api-payload', postProcessApiPayloadRequest)

// Catch all else routes for proper error presentation
createRoute('get', '/:bla', notFoundRoute)
createRoute('get', '/:bla/*', notFoundRoute)
createRoute('post', '/:bla', notFoundRoute)
createRoute('post', '/:bla/*', notFoundRoute)
createRoute('put', '/:bla', notFoundRoute)
createRoute('put', '/:bla/*', notFoundRoute)
createRoute('delete', '/:bla', notFoundRoute)
createRoute('delete', '/:bla/*', notFoundRoute)
