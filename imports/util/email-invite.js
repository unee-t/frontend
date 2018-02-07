import { Email } from 'meteor/email'

const supportEmail = process.env.FROM_EMAIL

export const invite = (user, invitedBy) =>
  Email.send({
    to: user.emails[0].address,
    from: supportEmail,
    subject: `Invite by ${invitedBy.profile.name || invitedBy.emails[0].address}`,
    text: `Hi there,

You have been invited to contribute to a case.

Please click the link below to get started:
${process.env.ROOT_URL}/invitation?code=${user.invitedToCases[0].accessToken}

Kind regards,
`})
