/* global JsonRoutes */
import { json } from 'body-parser'
import getPendingInvitations from './get-pending-invitations'
import putPendingInvitations from './put-pending-invitations'
import getInvitations from './get-invitations'
import getConvertedInvitations from './get-converted-invitations'
import postProcessDbChangeMessage from './post-process-db-change-message'
import postSesNotification from './post-ses-notification'
import getPdfDownload from './get-pdf-download'
import orders from './stripe/orders'
import webhook from './stripe/webhook'

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

createRoute('get', '/pending-invitations', getPendingInvitations)
createRoute('get', '/invitations', getInvitations)
createRoute('get', '/converted-invitations', getConvertedInvitations)
createRoute('put', '/pending-invitations/done', putPendingInvitations)
createRoute('post', '/db-change-message/process', postProcessDbChangeMessage)
createRoute('post', '/ses', postSesNotification)
createRoute('get', '/report-pdf-download', getPdfDownload)

/** From https://github.com/stripe/stripe-payments-demo/blob/master/server/node/routes.js#L28
 * Stripe integration to accept all types of payments with 3 POST endpoints.
 *
 * 1. POST endpoint to create orders with all user information.
 * TODO 2. POST endpoint to complete a payment immediately when a card is used.
 * For payments using Elements, Payment Request, Apple Pay, Google Pay, Microsoft Pay.
 * 3. POST endpoint to be set as a webhook endpoint on your Stripe account.
 * It creates a charge as soon as a non-card payment source becomes chargeable.
 */

createRoute('post', '/stripe/orders', orders)
createRoute('post', '/stripe/webhook', webhook)
