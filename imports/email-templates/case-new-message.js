import url from 'url'
import { matchWidth } from '../util/cloudinary-transformations'
import { createEngagementLink, resolveUserName, optOutHtml, optOutText } from './components/helpers'

function linkAttachment (message) {
  const msgParts = message.trim().split(/\s+/)
  if (msgParts.length > 1 && msgParts[0] === '[!attachment]') {
    const attachmentUrl = msgParts[1]
    if (attachmentUrl.match(/\.(jpeg|jpg|gif|png)$/) != null) {
      const thumbUrl = matchWidth(attachmentUrl, 500)
      return `<a href=${thumbUrl}><img alt="Attachment image" src=${thumbUrl}></a>`
    }
  }
  return message
}

export default (assignee, notificationId, settingType, caseTitle, caseId, user, message) => ({
  subject: `New message on case "${caseTitle}"`,
  html: `<img src="cid:logo@unee-t.com"/>

<p>Hi ${resolveUserName(assignee)},</p>

<p>New message by ${resolveUserName(user)}:</p>

<p><strong>${linkAttachment(message)}</strong></p>

<p>Please follow <a href='${
  createEngagementLink({
    url: url.resolve(process.env.ROOT_URL, `/case/${caseId}`),
    id: notificationId,
    email: assignee.emails[0].address
  })
  }'>${url.resolve(process.env.ROOT_URL, `/case/${caseId}`)}</a> to participate.</p>

  ` + optOutHtml(settingType, notificationId, assignee),
  text: `

Hi ${resolveUserName(assignee)},

New message by ${resolveUserName(user)}:

 > ${message}

  Please follow ${
  createEngagementLink({
    url: url.resolve(process.env.ROOT_URL, `/case/${caseId}`),
    id: notificationId,
    email: assignee.emails[0].address
  })
  } to participate.

  ` + optOutText(settingType, notificationId, assignee),
  attachments: [{
    path: 'https://s3-ap-southeast-1.amazonaws.com/prod-media-unee-t/2018-06-14/unee-t_logo_email.png',
    cid: 'logo@unee-t.com'
  }]
})
