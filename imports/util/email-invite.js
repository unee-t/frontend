import { Email } from 'meteor/email'
import url from 'url'
import bugzillaApi from '../util/bugzilla-api'
import { footer } from '../ui/util/marketing'
const { callAPI } = bugzillaApi

export const invite = (user, invitedBy) => {
  try {
    const { accessToken, caseId, unitId, role: inviteeRole } = user.receivedInvites[0]
    const caseData = callAPI('get', `/rest/bug/${caseId}`, {}, true, true)
    const unitData = callAPI('get', `/rest/product/${unitId}`, {}, true, true)
    const caseTitle = caseData.data.bugs[0].summary
    const unitName = unitData.data.products[0].name.trim()
    const unitDesc = unitData.data.products[0].description.replace(/[\n\r]+/g, ' ').trim()
    const invitorUsername = invitedBy.profile.name
    const invitorEmailAddress = invitedBy.emails[0].address
    const invitorRole = unitData.data.products[0].components.find(
      ({default_assigned_to: defAssigned}) => defAssigned === invitedBy.emails[0].address
    )
    const roleStr = invitorRole ? invitorRole.name : 'Administrator'

    Email.send({
      to: user.emails[0].address,
      from: process.env.FROM_EMAIL,
      replyTo: `${invitorUsername} <${invitorEmailAddress}>`,
      subject: `New Case: ${caseTitle}`,
      text: `Hi,

${invitorUsername || invitorEmailAddress},
the ${roleStr} for the unit ${unitName}
${unitDesc}
has invited you to collaborate on the case [${caseTitle}]
as the ${inviteeRole} for that unit.

Please click on the link to get more information about the case and reply to ${invitorUsername || 'him'}:
${url.resolve(process.env.ROOT_URL, `/invitation?code=${accessToken}`)}

${footer}
`,
      html: `<img src="cid:logo@unee-t.com"/>

<p>Hi,</p>
<p>
<br>${invitorUsername || invitorEmailAddress},
<br>the ${roleStr} for the unit
<br><b>${unitName}</b>
<br>${unitDesc}
<br>has invited you to collaborate on the case <b>${caseTitle}</b>
<br>as the <b>${inviteeRole}</b> for that unit.
</p>
<p>
<br>Please click on <a href=${url.resolve(process.env.ROOT_URL, `/invitation?code=${accessToken}`)}>this link</a> to get more information about the case and reply to ${invitorUsername || 'him'}.
<br>If the above link does not work, copy paste this in your browser: ${url.resolve(process.env.ROOT_URL, `/invitation?code=${accessToken}`)}
</p>
<p>${footer}</p>
`,
      attachments: [{
        path: 'https://s3-ap-southeast-1.amazonaws.com/prod-media-unee-t/2018-06-14/unee-t_logo_email.png',
        cid: 'logo@unee-t.com'
      }]
    })
  } catch (e) {
    console.log(e)
  }
}
