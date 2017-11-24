import { inviteUser } from '../../util/user-invitation'

export default (req, res) => {
  const { email, claimId, unitId, role } = req.body
  inviteUser(email, claimId, unitId, role)
  console.log(`Generated claim invitation for ${email}, for claim ${claimId}`)
  res.send(`Invitation to ${email} was sent successfully!`)
}
