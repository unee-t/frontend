import { HTTP } from 'meteor/http'

export function callAPI (method, endpoint, payload = {}, isAdmin = false, isSync = false) {
  const base = process.env.BUGZILLA_URL || 'http://localhost:8081'
  const finalPayload = isAdmin ? Object.assign({api_key: process.env.BUGZILLA_ADMIN_KEY}, payload) : payload
  const options = {}
  if (method.toLowerCase() === 'get') {
    options.params = finalPayload
  } else {
    options.data = finalPayload
  }
  let innerResolve, innerReject
  const callback = isSync ? undefined : (err, result) => {
    if (err) {
      innerReject(err)
    } else {
      innerResolve(result.data)
    }
  }
  const httpCall = HTTP.call(method, base + endpoint, options, callback)
  return isSync ? httpCall : new Promise((resolve, reject) => {
    innerResolve = resolve
    innerReject = reject
  })
}
