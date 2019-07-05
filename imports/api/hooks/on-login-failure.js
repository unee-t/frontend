import { Accounts } from 'meteor/accounts-base'
import { logger } from '../../util/logger'

Accounts.onLoginFailure(({ user, type, error }) => {
  const userIdentifier = user.emails ? `User with email ${user.emails[0].address}` : `User ${user._id}`
  logger.warn(`${userIdentifier} has tried to login with the '${type}' method unsuccessfully. Reason: "${error.reason}"`)
})
