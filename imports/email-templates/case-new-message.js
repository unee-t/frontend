import url from 'url'
import { resolveUserName, optOutHtml, optOutText } from './components/helpers'

export default (assignee, notificationId, settingType, caseTitle, caseId, user, message) => ({
  subject: `New message on case "${caseTitle}"`,
  html: `<img src="cid:logo@unee-t.com"/>

<p>Hi ${resolveUserName(assignee)},</p>

<p>New message by ${resolveUserName(user)}:</p>

<p>${message}</p>

<p>Please follow <a href='${url.resolve(process.env.ROOT_URL, `/case/${caseId}`)}'>${url.resolve(process.env.ROOT_URL, `/case/${caseId}`)}</a> to participate.</p>

` + optOutHtml(settingType, notificationId, assignee),
  text: `

Hi ${resolveUserName(assignee)},

New message by ${resolveUserName(user)}:

${message}

Please follow ${url.resolve(process.env.ROOT_URL, `/case/${caseId}`)} to participate.

` + optOutText(settingType, notificationId, assignee),
  attachments: [{
    path: 'https://s3-ap-southeast-1.amazonaws.com/prod-media-unee-t/2018-06-14/unee-t_logo_email.png',
    cid: 'logo@unee-t.com'
  }]
})
