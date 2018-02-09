import { Meteor } from 'meteor/meteor'

if (Meteor.isServer) {
  Meteor.publish('users.myBzLogin', function () {
    if (!this.userId) {
      this.ready()
      this.error(new Meteor.Error({message: 'Authentication required'}))
      return false
    }
    return Meteor.users.find({_id: this.userId}, {
      fields: {
        'bugzillaCreds.login': 1
      }
    })
  })
}
