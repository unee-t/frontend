import { Meteor } from 'meteor/meteor'

export function createComment (text, claimId) {
  return () => {
    Meteor.call('comments.insert', text, parseInt(claimId))
  }
}
