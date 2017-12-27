import inviteUserUtil from '../../util/user-invitation'

export default (req, res) => {
  const { inviteUser } = inviteUserUtil
  const { email, claimId, unitId, role } = req.body
  inviteUser(email, claimId, unitId, role)
  console.log(`Generated case invitation for ${email}, for case ${claimId}`)
  res.send(`Invitation to ${email} was sent successfully!`)
}
