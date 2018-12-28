import inviteUserUtil from '../../util/user-invitation'
import { logger } from '../../util/logger'

export default (req, res) => {
  const { inviteUser } = inviteUserUtil
  const { email, claimId, unitId, role } = req.body
  inviteUser(email, claimId, unitId, role)
  logger.info(`Generated case invitation for ${email}, for case ${claimId}`)
  res.send(`Invitation to ${email} was sent successfully!`)
}
