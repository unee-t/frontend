import url from 'url'
import { createEngagementLink, resolveUserName, getCaseAccessPath } from './components/helpers'
import notificationEmailLayout from './components/notification-email-layout'

export default (assignee, notificationId, settingType, unitMeta, caseTitle, caseId, message, user) => {
  const casePath = getCaseAccessPath(assignee, caseId)

  const optOutUrl = createEngagementLink({
    url: url.resolve(process.env.ROOT_URL, '/notification-settings'),
    id: notificationId,
    email: assignee.emails[0].address
  })

  const accessUrl = createEngagementLink({
    url: url.resolve(process.env.ROOT_URL, casePath),
    id: notificationId,
    email: assignee.emails[0].address
  })
  return {
    subject: `Case updated ${caseTitle} in ${unitMeta.displayName} at ${unitMeta.streetAddress}`,
    ...notificationEmailLayout({
      typeTitle: 'Case updated',
      user: assignee,
      mainContentHtml: `
        <p>
          The case <strong>${caseTitle}</strong> in ${unitMeta.displayName} at ${unitMeta.streetAddress} has had a change in <strong>${message.update_what}</strong> from <strong>'${message.old_value}'</strong> to <strong>'${message.new_value}'</strong> made by ${resolveUserName(user)}.
        </p>
      `,
      mainContentText: `
        The case ${caseTitle} in ${unitMeta.displayName} at ${unitMeta.streetAddress} has had a change in ${message.update_what} from '${message.old_value}' to '${message.new_value}' made by ${resolveUserName(user)}.      
      `,
      reasonExplanation: 'there has been an update on a case',
      optOutUrl,
      accessUrl
    })
  }
}
