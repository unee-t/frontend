import { Accounts } from 'meteor/accounts-base'
import { Meteor } from 'meteor/meteor'
import bugzillaApi from '../../util/bugzilla-api'

// Exported for testing purposes
export function onCreateUser (options, user) {
  const { callAPI } = bugzillaApi
  const {bzLogin, bzPass} = options.profile
  delete options.profile.bzLogin
  delete options.profile.bzPass

  // Creating a random bz pass if one was not provided
  const password = bzPass || 'a' + Math.floor(0xffffff * Math.random()) + '!'
  const { email } = options
  console.log('creating user for', email)
  const customizedUser = Object.assign({
    bugzillaCreds: {
      login: bzLogin || email,
      password: bzPass ? null : password
    }
  }, user)

  // Checking if there's an existing bz user, or creating one
  if (!bzLogin && !bzPass) {
    try {
      callAPI('post', '/rest/user', {email, password}, true, true)
    } catch (e) {
      console.error(e)
      throw new Meteor.Error({message: 'REST API error', origError: e})
    }
  }

  let loginResult
  try {
    loginResult = callAPI('get', '/rest/login', {login: email, password}, false, true)
  } catch (e) {
    console.error(e)
    throw new Meteor.Error({message: 'REST API error', origError: e})
  }
  const {token, id} = loginResult.data
  Object.assign(customizedUser.bugzillaCreds, {token, id})
  customizedUser.profile = options.profile
  console.log(`User for ${email} was created successfully`)
  return customizedUser
}
if (Meteor.isServer) {
  Accounts.onCreateUser(onCreateUser)
}
