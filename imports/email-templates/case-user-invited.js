import url from 'url'
import { createEngagementLink, resolveUserName, optOutHtml, optOutText, getCaseAccessPath } from './components/helpers'

export default (invitee, notificationId, settingType, caseTitle, caseId) => {
  const casePath = getCaseAccessPath(invitee, caseId)
  return {
    subject: `Collaborate on "${caseTitle}"`,
    html: `
<img src="cid:logo@unee-t.com"/>
<p>Hi ${resolveUserName(invitee)},</p>
<p>You've been invited to collaborate on a case <strong>${caseTitle}</strong> in Unee-T.</p>
<p>Please follow <a href='${createEngagementLink({
    url: url.resolve(process.env.ROOT_URL, casePath),
    id: notificationId,
    email: invitee.emails[0].address
  })}'>${url.resolve(process.env.ROOT_URL, casePath)}</a> to participate.</p>

  ` + optOutHtml(settingType, notificationId, invitee),
    text: `Hi ${resolveUserName(invitee)},

You've been invited to collaborate on a case ${caseTitle} in Unee-T.

Please follow ${createEngagementLink({
    url: url.resolve(process.env.ROOT_URL, casePath),
    id: notificationId,
    email: invitee.emails[0].address
  })} to participate.

  ` + optOutText(settingType, notificationId, invitee),
    attachments: [{
      path: 'https://s3-ap-southeast-1.amazonaws.com/prod-media-unee-t/2018-06-14/unee-t_logo_email.png',
      cid: 'logo@unee-t.com'
    }]
  }
}
