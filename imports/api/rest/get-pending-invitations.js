import { PendingInvitations } from '../pending-invitations'
export default (req, res) => {
  if (req.query.accessToken === process.env.API_ACCESS_TOKEN) {
    res.send(PendingInvitations.find({ done: { $ne: true } }).fetch())
  } else {
    res.send(401)
  }
}
