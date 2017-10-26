import { Accounts } from 'meteor/accounts-base'
import { Meteor } from 'meteor/meteor'
import bugzillaApi from '../../util/bugzilla-api'

// Exported for testing purposes
export function onCreateUser (options, user) {
  const { callAPI } = bugzillaApi
  const password = 'a' + Math.floor(0xffffff * Math.random()) + '!'
  const { email } = options
  console.log('creating user for', email)
  const customizedUser = Object.assign({
    bugzillaCreds: {
      login: email,
      password
    }
  }, user)

  let creationResult
  try {
    creationResult = callAPI('post', '/rest/user', {email, password}, true, true)
  } catch (e) {
    console.error(e)
    throw new Meteor.Error({message: 'REST API error', origError: e})
  }
  Object.assign(customizedUser.bugzillaCreds, {id: creationResult.data.id})

  let loginResult
  try {
    loginResult = callAPI('get', '/rest/login', {login: email, password}, false, true)
  } catch (e) {
    console.error(e)
    throw new Meteor.Error({message: 'REST API error', origError: e})
  }
  Object.assign(customizedUser.bugzillaCreds, {token: loginResult.data.token})
  customizedUser.profile = options.profile
  console.log(`User for ${email} was created successfully`)
  return customizedUser
}
if (Meteor.isServer) {
  Accounts.onCreateUser(onCreateUser)
}
