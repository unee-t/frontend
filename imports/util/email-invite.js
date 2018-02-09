import { Email } from 'meteor/email'
import url from 'url'

export const invite = (user, invitedBy) =>
  Email.send({
    to: user.emails[0].address,
    from: process.env.FROM_EMAIL,
    subject: `Invite by ${invitedBy.profile.name || invitedBy.emails[0].address}`,
    text: `Hi there,

You have been invited to contribute to a case.

Please click the link below to get started:
${url.resolve(process.env.ROOT_URL, `/invitation?code=${user.invitedToCases[0].accessToken}`)}

Kind regards,
`})
