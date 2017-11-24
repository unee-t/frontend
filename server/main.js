import { Meteor } from 'meteor/meteor'
import '../imports/api/tasks'
import '../imports/api/claims'
import '../imports/api/comments'
import '../imports/api/hooks/on-create-user'
import '../imports/api/rest/rest-routes'

Meteor.startup(() => {
  // code to run on server at startup
})
