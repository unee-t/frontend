import url from 'url'
import { optOutHtml, optOutText } from './components/helpers'

export default (assignee, notificationId, settingType, caseTitle, caseId) => ({
  subject: `Assigned to "${caseTitle}"`,
  html: `<img src="cid:logo@unee-t.com"/><pre>##- This is a notification message - Please use this link ${url.resolve(process.env.ROOT_URL, `/case/${caseId}`)} to reply -##</pre>

<p>Hi ${assignee.profile.name || assignee.emails[0].address.split('@')[0]},</p>

<p>You have been assigned the case <strong>${caseTitle}</strong> in Unee-T.</p>

<p>Please follow <a href='${url.resolve(process.env.ROOT_URL, `/case/${caseId}`)}'>${url.resolve(process.env.ROOT_URL, `/case/${caseId}`)}</a> to participate.</p>

` + optOutHtml(settingType, notificationId, assignee),
  text: `##- This is a notification message - Please use this link ${url.resolve(process.env.ROOT_URL, `/case/${caseId}`)} to reply -##

Hi ${assignee.profile.name || assignee.emails[0].address.split('@')[0]},

You have been assigned the case ${caseTitle}.

Please follow ${url.resolve(process.env.ROOT_URL, `/case/${caseId}`)} to participate.

` + optOutText(settingType, notificationId, assignee),
  attachments: [{
    path: 'https://s3-ap-southeast-1.amazonaws.com/prod-media-unee-t/2018-06-14/unee-t_logo_email.png',
    cid: 'logo@unee-t.com'
  }]
})
