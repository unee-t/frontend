import { PendingInvitations } from '../pending-invitations'
export default (req, res) => {
  if (req.query.accessToken !== process.env.API_ACCESS_TOKEN) {
    res.send(401)
    return
  }

  console.log('Marking done:', req.body)
  try {
    const results = PendingInvitations.update({ _id: { $in: req.body },
      done: { $ne: true } },
      { $set: { done: true } })
    res.send(200, results)
  } catch (e) {
    res.send(500, e)
  }
}
