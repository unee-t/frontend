import { PendingInvitations } from '../pending-invitations'
export default (req, res) => {
  if (req.query.accessToken === process.env.API_ACCESS_TOKEN) {
    console.log('Marking done:', req.body)

    try {
      const results = PendingInvitations.update({ _id: { $in: req.body },
        ready: { $ne: true } },
        { $set: { ready: true } })
      res.send(200, results)
    } catch (e) {
      res.send(500, e)
    }
  } else {
    res.send(401)
  }
}
