import url from 'url'
import unsubscribeClause from './components/unsubscribe-clause'

export default (assignee, caseTitle, caseId, updateWhat, userId) => ({
  subject: `Case updated "${caseTitle}"`,
  html: `<img src="cid:logo@unee-t.com"/>

<p>Hi ${assignee.profile.name || assignee.emails[0].address.split('@')[0]},</p>

<p>The case <strong>${caseTitle}</strong> has had a ${updateWhat} made by ${userId.profile.name}.</p>

<p>Please follow <a href='${url.resolve(process.env.ROOT_URL, `/case/${caseId}`)}'>${url.resolve(process.env.ROOT_URL, `/case/${caseId}`)}</a> to participate.</p>

<p><a href=https://unee-t.com>Unee-T</a>, managing and sharing 'To Do's for your properties has never been easier.</p>
` + unsubscribeClause.html,
  text: `Hi ${assignee.profile.name || assignee.emails[0].address.split('@')[0]},

${caseTitle} has has a ${updateWhat} made by ${userId}.

Please follow ${url.resolve(process.env.ROOT_URL, `/case/${caseId}`)} to participate.

Unee-T, managing and sharing 'To Do's for your properties has never been easier.
` + unsubscribeClause.text,
  attachments: [{
    path: 'https://s3-ap-southeast-1.amazonaws.com/prod-media-unee-t/2018-06-14/unee-t_logo_email.png',
    cid: 'logo@unee-t.com'
  }]
})
