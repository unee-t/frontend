import AccessInvitations from '../access-invitations'
// How many non-users have completed sign up via an invite?
// We only count the first time, the user accessed any invite to any case
// https://github.com/unee-t/frontend/issues/116
export default (req, res) => {
  if (req.query.accessToken === process.env.API_ACCESS_TOKEN) {
    const query = { 'dates.0': {} }
    if (req.query.from) { query['dates.0']['$gte'] = new Date(req.query.from) }
    if (req.query.to) { query['dates.0']['$lte'] = new Date(req.query.to) }
    AccessInvitations.rawCollection().aggregate([
      {$match: query},
      {$unwind: '$dates'},
      {$sort: {dates: 1}},
      {$group: {
        _id: { userId: '$userId' },
        units: { $addToSet: '$unitId' },
        firstOccurance: { $first: '$dates' }
      }}
    ]).toArray()
      .then(docs => {
        res.send(docs)
      })
      .catch(err => {
        res.send(500, err)
      })
  } else {
    res.send(401)
  }
}
