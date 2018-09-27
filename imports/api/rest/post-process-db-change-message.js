import { Meteor } from 'meteor/meteor'
import { Email } from 'meteor/email'
import crypto from 'crypto'
import MessagePayloads from '../message-payloads'
import CaseNotifications from '../case-notifications'
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
  'Solution',
  'Status',
  'CC'
]

function getUserByBZId (idStr) {
  return Meteor.users.findOne({ 'bugzillaCreds.id': parseInt(idStr) })
}

const fromEmail = process.env.FROM_EMAIL
const emailDomain = process.env.STAGE ? `case.${process.env.STAGE}.${process.env.DOMAIN}` : `case.${process.env.DOMAIN}`

function sendEmail (assignee, emailContent, notificationId, responseBugId) {
  const emailAddr = assignee.emails[0].address
  const bzId = assignee.bugzillaCreds.id
  const emailProps = {
    to: emailAddr,
    from: fromEmail
  }

  if (responseBugId) {
    const signature = crypto
      .createHmac('sha256', process.env.API_ACCESS_TOKEN)
      .update(responseBugId.toString() + bzId.toString())
      .digest('hex')

    emailProps.replyTo = `reply+${responseBugId}-${bzId}-${signature}@${emailDomain}`
  }
  try {
    Email.send(Object.assign(emailProps, emailContent))
    console.log('Sent', emailAddr, 'notification:', notificationId)
  } catch (e) {
    console.error(`An error ${e} occurred while sending an email to ${emailAddr}`)
  }
}

const settingTypeMapping = {
  case_assignee_updated: 'assignedExistingCase',
  case_new_message: 'caseNewMessage',
  case_updated: 'caseUpdate',
  case_user_invited: 'invitedToCase'
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

  console.log('Incoming to /api/db-change-message/process', message.notification_id)
  const payloadId = MessagePayloads.insert(message)

  // Common between https://github.com/unee-t/lambda2sns/tree/master/tests/events
  const {
    notification_type: type,
    case_title: caseTitle,
    case_id: caseId,
    unit_id: unitId,
    notification_id: notificationId
  } = message

  let userIds, emailTemplateParams, emailTemplateFn, objectTemplate
  switch (type) {
    case 'case_assignee_updated':
      // https://github.com/unee-t/sns2email/issues/2
      // When the user assigned to a case change, we need to inform the person who is the new assignee to that case.
      // TODO: notify the de-assigned user?
      userIds = [message.new_case_assignee_user_id]
      emailTemplateFn = caseAssigneeUpdateTemplate
      emailTemplateParams = [caseTitle, caseId]
      break

    case 'case_new_message':
      // https://github.com/unee-t/lambda2sns/issues/5
      userIds = message.current_list_of_invitees.split(', ').concat([
        message.new_case_assignee_user_id,
        message.case_reporter_user_id
      ]).filter(id => id !== message.created_by_user_id) // Preventing a notification being sent to the creator
      emailTemplateFn = caseNewMessageTemplate
      const creator = getUserByBZId(message.created_by_user_id)
      emailTemplateParams = [caseTitle, caseId, creator, message.message_truncated]
      objectTemplate = {
        type: 'message',
        typeSpecific: {
          createdBy: creator._id,
          content: message.message_truncated
        }
      }
      break

    case 'case_updated':
      // https://github.com/unee-t/lambda2sns/issues/4
      // More are notified: https://github.com/unee-t/lambda2sns/issues/4#issuecomment-399339075
      userIds = message.current_list_of_invitees.split(', ').concat([
        message.new_case_assignee_user_id,
        message.case_reporter_user_id
      ]).filter(id => id !== message.user_id)
      emailTemplateFn = caseUpdatedTemplate
      const updater = getUserByBZId(message.user_id)
      emailTemplateParams = [caseTitle, caseId, message.update_what, updater]
      objectTemplate = {
        type: 'update',
        typeSpecific: {
          madeBy: updater._id,
          fieldName: message.update_what
        }
      }
      break

    case 'case_user_invited':
      // https://github.com/unee-t/sns2email/issues/3
      userIds = [message.invitee_user_id]
      emailTemplateFn = caseUserInvitedTemplate
      emailTemplateParams = [caseTitle, caseId]
      break

    default:
      console.log('Unimplemented type:', type)
      res.send(400)
      return
  }
  ;(new Set(userIds)).forEach(userId => {
    const recipient = getUserByBZId(userId)
    if (!recipient) {
      console.error(`User with bz id ${userId} was not found in mongo`)
      return
    }

    // Checking if the content to create a client notification has been defined
    if (objectTemplate) {
      CaseNotifications.insert({
        userId: recipient._id,
        unitBzId: parseInt(unitId),
        caseId: parseInt(caseId),
        createdAt: new Date(),
        payloadId,
        ...objectTemplate
      })
    }

    if (!recipient.emails[0].verified) {
      console.error(`User with bz id ${userId} has no verified email address, skipping notification`)
      return
    }
    const settingType = settingTypeMapping[type]
    if (!recipient.notificationSettings[settingType]) {
      console.log(
        `Skipping ${recipient.bugzillaCreds.login} as opted out from '${settingType}' notifications.`
      )
    } else {
      const emailContent = emailTemplateFn(...[recipient, notificationId, settingType].concat(emailTemplateParams))
      sendEmail(recipient, emailContent, notificationId, caseId)
    }
  })

  res.send(200)
}
