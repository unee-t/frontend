import { Meteor } from 'meteor/meteor'
import { Email } from 'meteor/email'
import crypto from 'crypto'
import MessagePayloads from '../message-payloads'
import CaseNotifications from '../case-notifications'
import NotificationSettingsOverrides from '../notification-settings-overrides'
import caseAssigneeUpdateTemplate from '../../email-templates/case-assignee-updated'
import caseUpdatedTemplate from '../../email-templates/case-updated'
import caseNewMessageTemplate from '../../email-templates/case-new-message'
import caseUserInvitedTemplate from '../../email-templates/case-user-invited'
import { logger } from '../../util/logger'
import UnitRolesData from '../unit-roles-data'
import { CLOSED_STATUS_TYPES, severityIndex } from '../cases'
import UnitMetaData from '../unit-meta-data'

const updatedWhatWhiteList = [
  'Status',
  'Severity',
  'Unit',
  'Role',
  'Next Step',
  'Next Step Date',
  'Solution',
  'Deadline'
]

const updateWhatSettingMapping = {
  'Next Step': 'Next Step',
  'Next Step Date': 'Next Step',
  'Solution': 'Solution',
  'Deadline': 'Deadline'
}

function getUserByBZId (idStr) {
  return Meteor.users.findOne({ 'bugzillaCreds.id': parseInt(idStr) })
}

const fromEmail = process.env.FROM_EMAIL
const emailDomain = process.env.STAGE ? `case.${process.env.STAGE}.${process.env.DOMAIN}` : `case.${process.env.DOMAIN}`

function sendEmail (assignee, emailContent, notificationId, responseBugId, unitCreator) {
  const emailAddr = assignee.emails[0].address
  const bzId = assignee.bugzillaCreds.id

  let fromEmailVariant = fromEmail
  if (unitCreator && unitCreator.customEmailBrandingConfig && unitCreator.customEmailBrandingConfig.brandName) {
    const { brandName } = unitCreator.customEmailBrandingConfig
    const matchAddress = fromEmail.match(/<(.*@.*)>$/)
    const justEmailAddress = matchAddress ? matchAddress[1] : fromEmail
    fromEmailVariant = `Unee-T for ${brandName}<${justEmailAddress}>`
  }

  const emailProps = {
    to: emailAddr,
    from: fromEmailVariant
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
    logger.info('Sent', emailAddr, 'notification:', notificationId)
  } catch (e) {
    logger.error(`An error ${e} occurred while sending an email to ${emailAddr}`)
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
    logger.info(`Ignoring "case_updated" notification type with "${message.update_what}" update subject`)
    res.send(200)
    return
  }
  if (MessagePayloads.findOne({ notification_id: message.notification_id })) {
    logger.info(`Duplicate message ${message.notification_id}`)
    res.send(400, `Duplicate message ${message.notification_id}`)
    return
  }

  logger.info('Incoming to /api/db-change-message/process', message.notification_id)
  const payloadId = MessagePayloads.insert(message)

  // Common between https://github.com/unee-t/lambda2sns/tree/master/tests/events
  const {
    notification_type: type,
    case_title: caseTitle,
    case_id: caseId,
    unit_id: unitId,
    notification_id: notificationId
  } = message

  const unitMeta = UnitMetaData.findOne({ bzId: unitId }, {
    fields: {
      displayName: 1,
      streetAddress: 1,
      bzId: 1
    }
  }) || {
    displayName: `Unit ID ${unitId}`,
    streetAddress: 'Unknown',
    bzId: unitId
  }

  const unitCreator = unitMeta.creatorId && Meteor.users.findOne({ _id: unitMeta.creatorId })

  let userIds, emailTemplateParams, emailTemplateFn, objectTemplate, settingSubType
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

      // Finding the creator's role (if updated properly in Mongo)
      const creatorRole = UnitRolesData.findOne({
        unitBzId: parseInt(unitId),
        'members.id': creator._id
      })

      // If the creator's role is found, it is mapped to the setting sub type, as they correspond directly
      if (creatorRole) {
        settingSubType = creatorRole.roleType
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
      emailTemplateParams = [caseTitle, caseId, message, updater]
      objectTemplate = {
        type: 'update',
        typeSpecific: {
          madeBy: updater._id,
          fieldName: message.update_what
        }
      }
      if (['Solution', 'Deadline', 'Next Step', 'Next Step Date'].includes(message.update_what)) {
        settingSubType = updateWhatSettingMapping[message.update_what]
      }

      if (message.update_what === 'Status') {
        if (!CLOSED_STATUS_TYPES.includes(message.old_value) && CLOSED_STATUS_TYPES.includes(message.new_value)) {
          settingSubType = 'StatusResolved'
        } else {
          logger.info(`Ignoring "case_updated" notification type with "Status" update subject when the case is hasn't changed to a resolved status`)
          res.send(200)
          return
        }
      }

      // TODO: find out how this piece of code should know if "status" has changed to "resolved"
      break

    case 'case_user_invited':
      // https://github.com/unee-t/sns2email/issues/3
      userIds = [message.invitee_user_id]
      emailTemplateFn = caseUserInvitedTemplate
      emailTemplateParams = [caseTitle, caseId]
      break

    default:
      logger.info('Unimplemented type:', type)
      res.send(400)
      return
  }

  // Getting the setting type to check via static mapping
  const settingType = settingTypeMapping[type]
  let logMsg
  if (settingSubType) {
    logMsg = `Checking and assembling notification of type '${settingType}' and sub type '${settingSubType}' for each user`
  } else {
    logMsg = `Checking and assembling notification of type '${settingType}' for each user`
  }
  logger.info(logMsg)

  ;(new Set(userIds)).forEach(userId => {
    const recipient = getUserByBZId(userId)
    if (!recipient) {
      logger.error(`User with bz id ${userId} was not found in mongo`)
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

    let emailPrevented
    if (!recipient.emails[0].verified) {
      logger.error(`User with bz id ${userId} has no verified email address, skipping notification`)
      emailPrevented = true
    }

    if (recipient.emails[0].invalid) {
      logger.error(`User with bz id ${userId} has an invalid email address (bounced) of '${recipient.emails[0].address}', skipping notification`)
      emailPrevented = true
    }

    if (emailPrevented) return

    // Recursively resolving whether a specific main/sub setting overrides (case/ unit) are set for this user/notification
    let settingOverride = (function checkLevel (matcherLevels, overrides = {}) {
      const currLevel = matcherLevels.shift() // Removing the first "matcher" in line

      // Using the current level matcher to find the corresponding override for the user
      const notifOverride = NotificationSettingsOverrides.findOne({ userBzId: parseInt(userId), ...currLevel })

      // Checking if the override doc was defined for the user+matcher
      if (notifOverride) {
        // Checking if the main setting in question wasn't resolved from a prior level and is defined on this user+matcher doc
        if (
          typeof overrides.main === 'undefined' && typeof notifOverride.settings[settingType] !== 'undefined'
        ) {
          // Setting "main" to overrides from the user+matcher doc definition
          overrides.main = notifOverride.settings[settingType]
          logger.info(`A setting override for '${settingType}' notification was found for user ${userId} at ${JSON.stringify(currLevel)}`)
        }

        // Checking if a setting sub type is used AND an override from a lower level was not found yet AND it is defined on this level
        if (
          settingSubType &&
          typeof overrides.sub === 'undefined' &&
          typeof notifOverride.settings[`${settingType}_types`] === 'object' &&
          typeof notifOverride.settings[`${settingType}_types`][settingSubType] !== 'undefined'
        ) {
          // Setting "sub" to overrides from the user+matcher doc definition
          overrides.sub = notifOverride.settings[`${settingType}_types`][settingSubType]
          logger.info(`A sub type setting override for '${settingSubType}' notification was found for user ${userId} at ${JSON.stringify(currLevel)}`)
        }

        if (
          typeof overrides.severityOverrideThreshold === 'undefined' &&
          typeof notifOverride.settings.severityOverrideThreshold !== 'undefined'
        ) {
          overrides.severityOverrideThreshold = notifOverride.settings.severityOverrideThreshold
        }
      }

      // Checking if no more levels to check remain OR an override definition was found for all "main", "sub" (if required) and "severityOverrideThreshold" flags
      if (
        matcherLevels.length === 0 || (
          typeof overrides.main !== 'undefined' &&
          (typeof overrides.sub !== 'undefined' || !settingSubType) &&
          typeof overrides.severityOverrideThreshold !== 'undefined'
        )
      ) {
        return overrides
      } else {
        // Checking the next level, but using the current "overrides" in case just one of the main/sub defs were found and the next could be in a higher level
        return checkLevel(matcherLevels, overrides)
      }
    })([ // The matcher levels from low to high (low should take precedence)
      { caseId: parseInt(caseId) },
      { unitBzId: parseInt(unitId) }
    ])

    // If an override for the main setting was found, using it. Otherwise, using the global def
    const mainSettingEnabled = typeof settingOverride.main !== 'undefined'
      ? settingOverride.main
      : recipient.notificationSettings[settingType]

    // A flag that should be "true" if no sub type is needed to be checked for this notification OR it is and is set to "true"
    let subSettingCheckPassed

    // Checking if a sub type check is needed. If not, giving the check a "pass" (written in more drawn out way to make it more coherent)
    if (settingSubType) {
      // If an override for the sub setting was found, using it. Otherwise, using the global def
      subSettingCheckPassed = typeof settingOverride.sub !== 'undefined'
        ? settingOverride.sub
        : recipient.notificationSettings[`${settingType}_types`][settingSubType]
    } else {
      subSettingCheckPassed = true
    }

    const severityOverrideThreshold = typeof settingOverride.severityOverrideThreshold !== 'undefined'
      ? settingOverride.severityOverrideThreshold
      : recipient.notificationSettings.severityOverrideThreshold

    // The notification is determined to be enabled for this user in this scenario if both the main setting is enabled and the sub setting check has passed
    const notificationEnabled = (severityOverrideThreshold && severityIndex.indexOf(message.current_severity) <= severityIndex.indexOf(severityOverrideThreshold)) ||
      (mainSettingEnabled && subSettingCheckPassed)
    if (!notificationEnabled) {
      logger.info(
        `Skipping ${recipient.bugzillaCreds.login} as opted out from '${settingType}' notifications` + (settingSubType ? ` with '${settingSubType}' sub type` : '')
      )
    } else {
      try {
        const emailContent = emailTemplateFn(...[recipient, notificationId, settingType, unitMeta, unitCreator].concat(emailTemplateParams))
        sendEmail(recipient, emailContent, notificationId, caseId, unitCreator)
      } catch (e) {
        logger.warn(`Sending email notification to user ${userId} failed due to ${e.message}`)
      }
    }
  })

  res.send(200)
}
