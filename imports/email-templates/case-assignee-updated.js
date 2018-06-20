import url from 'url'

export default (assignee, caseTitle, caseId) => ({
  subject: `Assigned to "${caseTitle}"`,
  html: `<img src="cid:logo@unee-t.com"/>

<p>Hi ${assignee.profile.name || assignee.emails[0].address.split('@')[0]},</p>

<p>You have been assigned the case <strong>${caseTitle}</strong> in Unee-T.</p>

<p>Please follow <a href='${url.resolve(process.env.ROOT_URL, `/case/${caseId}`)}'>${url.resolve(process.env.ROOT_URL, `/case/${caseId}`)}</a> to participate.</p>

<p><a href=https://unee-t.com>Unee-T</a>, managing and sharing 'To Do's for your properties has never been easier.</p>
`,
  text: `Hi ${assignee.profile.name || assignee.emails[0].address.split('@')[0]},

You have been assigned the case ${caseTitle}.

Please follow ${url.resolve(process.env.ROOT_URL, `/case/${caseId}`)} to participate.

Unee-T, managing and sharing 'To Do's for your properties has never been easier.
`,
  attachments: [{
    path: 'https://s3-ap-southeast-1.amazonaws.com/prod-media-unee-t/2018-06-14/unee-t_logo_email.png',
    cid: 'logo@unee-t.com'
  }]
})
