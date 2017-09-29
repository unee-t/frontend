import { Meteor } from 'meteor/meteor'

Meteor.methods({
  'sign' () {
    // Make sure the user is logged in
    if (!Meteor.userId()) {
      throw new Meteor.Error('not-authorized')
    }
    return process.env.CLOUDINARY_KEY
  }
})
