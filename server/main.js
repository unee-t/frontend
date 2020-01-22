import { Meteor } from 'meteor/meteor'
import { Migrations } from 'meteor/percolate:migrations'

import '../imports/api/cases'
import '../imports/api/comments'
import '../imports/api/units'
import '../imports/api/reports'
import '../imports/api/pending-invitations'
import '../imports/api/custom-users'
import '../imports/api/case-field-values'
import '../imports/api/unit-meta-data'
import '../imports/api/unit-roles-data'
import '../imports/api/case-notifications'
import '../imports/api/notification-settings-overrides'
import '../imports/api/failed-unit-creations'
import '../imports/api/increment-counters'
import '../imports/api/internal-api-payloads'
import '../imports/api/promo-codes'
import '../imports/api/hooks/on-create-user'
import '../imports/api/hooks/on-login'
import '../imports/api/hooks/on-login-failure'
import '../imports/api/rest/rest-routes'
import '../imports/server/auth/otp-authenticator'
import '../imports/config/email'
import '../imports/migrations'

const publicClientEnvVars = ['CLOUDINARY_API_ENDPOINT', 'CLOUDINARY_PRESET']
Object.assign(Meteor.settings.public, publicClientEnvVars.reduce((obj, key) => {
  obj[key] = process.env[key]
  return obj
}, {}))

Meteor.startup(() => {
  Migrations.migrateTo('latest')
})
