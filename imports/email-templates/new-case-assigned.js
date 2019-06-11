import url from 'url'
import { createEngagementLink, getCaseAccessPath } from './components/helpers'
import notificationEmailLayout from './components/notification-email-layout'

export default (assignee, notificationId, settingType, unitMeta, unitCreator, caseTitle, caseId) => {
  const casePath = getCaseAccessPath(assignee, caseId, unitMeta.bzId)

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
    subject: `New case ${caseTitle} in ${unitMeta.displayName} at ${unitMeta.streetAddress} assigned to you`,
    ...notificationEmailLayout({
      typeTitle: 'New Case',
      user: assignee,
      mainContentHtml: `
        <p>A new case <strong>${caseTitle}</strong> has been reported in ${unitMeta.displayName} at ${unitMeta.streetAddress} and has been assigned to you</p>
      `,
      mainContentText: `
        A new case "${caseTitle}" has been reported in ${unitMeta.displayName} at ${unitMeta.streetAddress} and has been assigned to you
      `,
      reasonExplanation: 'you have been assigned to a new case',
      unitCreator,
      accessUrl,
      optOutUrl
    })
  }
}
