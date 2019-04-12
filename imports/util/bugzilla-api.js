import { HTTP } from 'meteor/http'
import { logger } from '../util/logger'

export function callAPI (method, endpoint, payload = {}, isAdmin = false, isSync = false) {
  const base = process.env.BUGZILLA_URL || 'http://localhost:8081'
  const finalPayload = isAdmin ? Object.assign({ api_key: process.env.BUGZILLA_ADMIN_KEY }, payload) : payload
  const options = {}
  let startTime
  if (method.toLowerCase() === 'get') {
    options.params = finalPayload
  } else {
    options.data = finalPayload
  }
  let innerResolve, innerReject
  const callback = isSync ? undefined : (err, result) => {
    const logPayload = {
      method,
      endpoint,
      payload,
      duration: Date.now() - startTime
    }
    if (err) {
      logger.request({
        error: err,
        ...logPayload
      })
      innerReject(err)
    } else {
      logger.request({
        statusCode: result.statusCode,
        ...logPayload
      })
      innerResolve(result.data)
    }
  }
  const returnedPromise = !isSync && new Promise((resolve, reject) => {
    innerResolve = resolve
    innerReject = reject
  })
  startTime = Date.now()
  let httpCall = HTTP.call(method, base + endpoint, options, callback)
  if (!callback) {
    logger.request({
      method,
      endpoint,
      statusCode: httpCall.statusCode,
      duration: Date.now() - startTime
    })
  }
  return returnedPromise || httpCall
}

export default {
  callAPI
}
