import { Meteor } from 'meteor/meteor'
import { Email } from 'meteor/email'
import MessagePayloads from '../message-payloads'
import caseUserInvitedTemplate from '../../email-templates/user-invited-to-case'
import caseAssigneeUpdateTemplate from '../../email-templates/case-assignee-updated'
import caseNewTemplate from '../../email-templates/case-new'

export default (req, res) => {
  if (req.query.accessToken !== process.env.API_ACCESS_TOKEN) {
    res.send(401)
    return
  }

  const message = req.body

  if (MessagePayloads.findOne({notification_id: message.notification_id})) {
    console.log(`Duplicate message ${message.notification_id}`)
    res.send(400, `Duplicate message ${message.notification_id}`)
    return
  }

  console.log('Incoming to /api/db-change-message/process', message)
  MessagePayloads.insert(message)

  const {
    notification_type: type,
    case_title: caseTitle,
    case_id: caseId,
    notification_id: notificationId
  } = message

  let userId, templateFunction, settingType

  switch (type) {
    case 'case_new':
      // https://github.com/unee-t/sns2email/issues/1
      // When a new case is created, we need to inform the person who is assigned to that case.
      userId = message.assignee_user_id
      templateFunction = caseNewTemplate
      settingType = 'assignedNewCase'
      break

    case 'case_assignee_updated':
      // https://github.com/unee-t/sns2email/issues/2
      // When the user assigned to a case change, we need to inform the person who is the new assignee to that case.
      userId = message.assignee_user_id
      templateFunction = caseAssigneeUpdateTemplate
      settingType = 'assignedExistingCase'
      break

    case 'case_user_invited':
      // https://github.com/unee-t/sns2email/issues/3
      userId = message.invitee_user_id
      templateFunction = caseUserInvitedTemplate
      settingType = 'invitedToCase'
      break

    default:
      console.log('Unimplemented type:', type)
      res.send(400)
      return
  }

  const assignee = Meteor.users.findOne({'bugzillaCreds.id': parseInt(userId)})
  if (!assignee) {
    console.error('Could deliver message to missing user of BZ ID: ' + userId)
    res.send(400)
    return
  }
  if (!assignee.notificationSettings[settingType]) {
    console.log(
      `${assignee.bugzillaCreds.login} has previously opted out from '${settingType}' notifications. ` +
       `Skipping email for notification ${notificationId}.`
    )
  } else {
    const emailAddr = assignee.emails[0].address
    const emailContent = templateFunction(assignee, caseTitle, caseId)
    try {
      Email.send(Object.assign({
        to: emailAddr,
        from: process.env.FROM_EMAIL
      }, emailContent))
      console.log('Sent', emailAddr, 'notification type:', type)
    } catch (e) {
      console.error(`An error ${e} occurred while sending an email to ${emailAddr}`)
    }
  }

  res.send(200)
}
