import url from 'url'
import { createEngagementLink, getCaseAccessPath } from './components/helpers'
import notificationEmailLayout from './components/notification-email-layout'

export default (assignee, notificationId, settingType, unitMeta, unitCreator, caseTitle, caseId) => {
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
    subject: `Assigned to ${caseTitle} in ${unitMeta.displayName} at ${unitMeta.streetAddress}`,
    ...notificationEmailLayout({
      typeTitle: 'Case Assigned',
      user: assignee,
      mainContentHtml: `
        <p>You have been assigned the case <strong>${caseTitle}</strong> in ${unitMeta.displayName} at ${unitMeta.streetAddress}.</p>
      `,
      mainContentText: `
        You have been assigned the case "${caseTitle}" in ${unitMeta.displayName} at ${unitMeta.streetAddress}.
      `,
      reasonExplanation: 'you have been assigned to a case',
      unitCreator,
      accessUrl,
      optOutUrl
    })
  }
}
