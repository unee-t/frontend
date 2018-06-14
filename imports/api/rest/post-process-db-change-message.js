import { Meteor } from 'meteor/meteor'
import { Email } from 'meteor/email'
import MessagePayloads from '../message-payloads'
import emailTemplate from '../../email-templates/user-invited-to-case'

export default (req, res) => {
  if (req.query.accessToken !== process.env.API_ACCESS_TOKEN) {
    res.send(401)
    return
  }

  const { Message: messageText } = req.body
  const message = JSON.parse(messageText)

  MessagePayloads.insert(message)

  const {
    notification_type: type,
    invitee_user_id: inviteeId,
    case_title: caseTitle,
    case_id: caseId
  } = message

  switch (type) {
    case 'case_user_invited':
      const invitee = Meteor.users.findOne({'bugzillaCreds.id': parseInt(inviteeId)})
      if (!invitee) {
        console.error('Could deliver message to missing user of BZ ID: ' + inviteeId)
        return
      }
      const emailAddr = invitee.emails[0].address
      const emailContent = emailTemplate(invitee, caseTitle, caseId)
      try {
        Email.send(Object.assign({
          to: emailAddr,
          from: process.env.FROM_EMAIL
        }, emailContent))
        console.log('Sent', emailAddr, 'notification type:', type)
      } catch (e) {
        console.error(`An error occurred while sending an email to ${emailAddr}`)
      }
      break
    default:
      console.log('Unimplemented type:', type)
  }
  res.send(200)
}
