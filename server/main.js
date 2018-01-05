import { Meteor } from 'meteor/meteor'
import '../imports/api/tasks'
import '../imports/api/cases'
import '../imports/api/comments'
import '../imports/api/hooks/on-create-user'
import '../imports/api/rest/rest-routes'

const publicSettings = {CLOUDINARY_URL, CLOUDINARY_PRESET} = process.env
Object.assign(Meteor.settings.public, publicSettings)
Meteor.startup(() => {
  // code to run on server at startup
})
