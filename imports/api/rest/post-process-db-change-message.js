import { Meteor } from 'meteor/meteor'
import { Email } from 'meteor/email'
import MessagePayloads from '../message-payloads'
import caseAssigneeUpdateTemplate from '../../email-templates/case-assignee-updated'
import caseUpdatedTemplate from '../../email-templates/case-updated'
import caseNewMessageTemplate from '../../email-templates/case-new-message'
import caseUserInvitedTemplate from '../../email-templates/case-user-invited'

const updatedWhatWhiteList = [
  'Unit',
  'Role',
  'Component',
  'Product',
  'Severity',
  'Priority',
  'Platform',
  'Case Category',
  'Summary',
  'Next Step',
  'AssignedTo',
  'Resolution',
  'Status',
  'CC'
]

function getUserByBZId (idStr) {
  return Meteor.users.findOne({ 'bugzillaCreds.id': parseInt(idStr) })
}

function sendEmail (assignee, emailContent, notificationId) {
  const emailAddr = assignee.emails[0].address
  try {
    Email.send(Object.assign({
      to: emailAddr,
      from: process.env.FROM_EMAIL
    }, emailContent))
    console.log('Sent', emailAddr, 'notification:', notificationId)
  } catch (e) {
    console.error(`An error ${e} occurred while sending an email to ${emailAddr}`)
  }
}

export default (req, res) => {
  if (req.query.accessToken !== process.env.API_ACCESS_TOKEN) {
    res.send(401)
    return
  }

  const message = req.body

  if (message.notification_type === 'case_updated' && !updatedWhatWhiteList.includes(message.update_what)) {
    console.log(`Ignoring "case_updated" notification type with "${message.update_what}" update subject`)
    res.send(200)
    return
  }
  if (MessagePayloads.findOne({ notification_id: message.notification_id })) {
    console.log(`Duplicate message ${message.notification_id}`)
    res.send(400, `Duplicate message ${message.notification_id}`)
    return
  }

  console.log('Incoming to /api/db-change-message/process', message)
  MessagePayloads.insert(message)

  // Common between https://github.com/unee-t/lambda2sns/tree/master/tests/events
  const {
    notification_type: type,
    case_title: caseTitle,
    case_id: caseId,
    notification_id: notificationId
  } = message

  let userIds, templateParams, templateFn, settingType

  switch (type) {
    case 'case_assignee_updated':
      // https://github.com/unee-t/sns2email/issues/2
      // When the user assigned to a case change, we need to inform the person who is the new assignee to that case.
      settingType = 'assignedExistingCase'
      userIds = [message.new_case_assignee_user_id]
      templateFn = caseAssigneeUpdateTemplate
      templateParams = [caseTitle, caseId]
      break

    case 'case_new_message':
      // https://github.com/unee-t/lambda2sns/issues/5
      settingType = 'caseNewMessage'
      userIds = message.current_list_of_invitees.split(',').concat([message.new_case_assignee_user_id])
      templateFn = caseNewMessageTemplate
      templateParams = [caseTitle, caseId, getUserByBZId(message.created_by_user_id), message.message_truncated]
      break

    case 'case_updated':
      // https://github.com/unee-t/lambda2sns/issues/4
      // More are notified: https://github.com/unee-t/lambda2sns/issues/4#issuecomment-399339075
      settingType = 'caseUpdate'
      userIds = message.current_list_of_invitees.split(',').concat([message.new_case_assignee_user_id, message.case_reporter_user_id])
      templateFn = caseUpdatedTemplate
      templateParams = [caseTitle, caseId, message.update_what, getUserByBZId(message.user_id)]
      break

    case 'case_user_invited':
      // https://github.com/unee-t/sns2email/issues/3
      settingType = 'invitedToCase'
      userIds = [message.invitee_user_id]
      templateFn = caseUserInvitedTemplate
      templateParams = [caseTitle, caseId]
      break

    default:
      console.log('Unimplemented type:', type)
      res.send(400)
      return
  }
  (new Set(userIds)).forEach(userId => {
    const recipient = getUserByBZId(userId)
    if (!recipient) {
      console.error(`User with bz id ${userId} was not found in mongo`)
      return
    }
    if (!recipient.emails[0].verified) {
      console.error(`User with bz id ${userId} has no verified email address, skipping notification`)
      return
    }
    if (!recipient.notificationSettings[settingType]) {
      console.log(
        `Skipping ${recipient.bugzillaCreds.login} as opted out from '${settingType}' notifications.`
      )
    } else {
      const emailContent = templateFn(...[recipient, notificationId, settingType].concat(templateParams))
      sendEmail(recipient, emailContent, notificationId)
    }
  })

  res.send(200)
}
