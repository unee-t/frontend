import { Meteor } from 'meteor/meteor'
import '../imports/api/tasks'
import '../imports/api/cases'
import '../imports/api/comments'
import '../imports/api/units'
import '../imports/api/pending-invitations'
import '../imports/api/custom-users'
import '../imports/api/case-field-values'
import '../imports/api/hooks/on-create-user'
import '../imports/api/hooks/on-login'
import '../imports/api/rest/rest-routes'
import '../imports/config/email'

const publicClientEnvVars = ['CLOUDINARY_URL', 'CLOUDINARY_PRESET']
Object.assign(Meteor.settings.public, publicClientEnvVars.reduce((obj, key) => {
  obj[key] = process.env[key]
  return obj
}, {}))

Meteor.startup(() => {
  // code to run on server at startup
})
