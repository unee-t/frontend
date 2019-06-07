import url from 'url'
import { createEngagementLink, resolveUserName, getCaseAccessPath } from './components/helpers'
import notificationEmailLayout from './components/notification-email-layout'

export default (assignee, notificationId, settingType, unitMeta, caseTitle, caseId, user, message) => {
  const casePath = getCaseAccessPath(assignee, caseId)
  const accessUrl = createEngagementLink({
    url: url.resolve(process.env.ROOT_URL, casePath),
    id: notificationId,
    email: assignee.emails[0].address
  })
  const optOutUrl = createEngagementLink({
    url: url.resolve(process.env.ROOT_URL, '/notification-settings'),
    id: notificationId,
    email: assignee.emails[0].address
  })
  return {
    subject: `New message on case ${caseTitle} in ${unitMeta.displayName} at ${unitMeta.streetAddress}`,
    ...notificationEmailLayout({
      typeTitle: 'New message on a case',
      user: assignee,
      mainContentHtml: `
        <p>New message by ${resolveUserName(user)}:</p>
        <p><strong>"${message}"</strong></p>
      `,
      mainContentText: `
        New message by ${resolveUserName(user)}:
        
        "${message}"
        
      `,
      reasonExplanation: 'you have a new message on a case',
      accessUrl,
      optOutUrl
    })
  }
}
