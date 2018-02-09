/* global JsonRoutes */
import bodyParser from 'body-parser'
// import invitationCreateRoute from './invitation-create'
import getPendingInvitations from './get-pending-invitations'
import putPendingInvitations from './put-pending-invitations'

JsonRoutes.Middleware.use(bodyParser())
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

// createRoute('post', '/invitation', invitationCreateRoute)
createRoute('get', '/pending-invitations', getPendingInvitations)
createRoute('put', '/pending-invitations/done', putPendingInvitations)
