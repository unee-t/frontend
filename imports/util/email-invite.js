import { Email } from 'meteor/email'
import url from 'url'
import bugzillaApi from '../util/bugzilla-api'
const { callAPI } = bugzillaApi

export const invite = (user, invitedBy) => {
  try {
    const { accessToken, caseId, unitId, role: inviteeRole } = user.invitedToCases[0]
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
      text: `Hi there,

${invitorUsername || invitorEmailAddress}, the ${roleStr} for the Unit ${unitName} (${unitDesc}) has invited you to collaborate on the case ${caseTitle} as the ${inviteeRole} for that unit.

Please click the link below to get more information about the case and reply to ${invitorUsername || 'him'}:
${url.resolve(process.env.ROOT_URL, `/invitation?code=${accessToken}`)}

Kind regards,
`})
  } catch (e) { console.log(e) }
}
