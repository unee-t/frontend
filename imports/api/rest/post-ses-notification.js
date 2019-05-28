import { Meteor } from 'meteor/meteor'
import { logger } from '../../util/logger'

export default (req, res) => {
  if (req.headers['authorization'] !== `Bearer ${process.env.API_ACCESS_TOKEN}`) {
    res.send(401)
    return
  }

  const message = req.body
  if (!message.bounce) {
    logger.info('Ignored', message)
    return res.send(200)
  }

  switch (message.bounce.bounceType) {
    case 'Permanent':
    case 'Transient':
      logger.info('Mark invalid', message.bounce.bouncedRecipients[0].emailAddress)
      Meteor.users.update(
        { 'emails.address': message.bounce.bouncedRecipients[0].emailAddress },
        {
          $set: { 'emails.$.invalid': true }
        }
      )
      break
    default:
      logger.info('Ignored', message)
  }

  res.send(200)
}
