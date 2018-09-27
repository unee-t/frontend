import { Meteor } from 'meteor/meteor'

export default (req, res) => {
  if (req.headers['authorization'] !== `Bearer ${process.env.API_ACCESS_TOKEN}`) {
    res.send(401)
    return
  }

  const message = req.body

  switch (message.bounce.bounceType) {
    case 'Permanent':
    case 'Transient':
      console.log('Mark invalid', message.bounce.bouncedRecipients[0].emailAddress)
      Meteor.users.update(
        { 'emails.address': message.bounce.bouncedRecipients[0].emailAddress },
        {
          $set: { 'emails.$.invalid': true }
        }
      )
      break
    default:
      console.log('Ignored', message)
  }

  res.send(200)
}
