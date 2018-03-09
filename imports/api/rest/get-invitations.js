import { Meteor } from 'meteor/meteor'
// How many non-users have been invited ?
// https://github.com/unee-t/frontend/issues/116
export default (req, res) => {
  if (req.query.accessToken === process.env.API_ACCESS_TOKEN) {
    // Note that "done" does not mean the invite has converted.
    // It only means the user was processed on the Bugzilla backend.
    const query = { createdAt: {}, invitedToCases: { $elemMatch: { done: { $eq: true } } } }
    if (req.query.from) { query.createdAt['$gte'] = new Date(req.query.from) }
    if (req.query.to) { query.createdAt['$lte'] = new Date(req.query.to) }
    res.send(Meteor.users.find(query).fetch())
  } else {
    res.send(401)
  }
}
