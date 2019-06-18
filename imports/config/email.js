import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import { getHtml, getText } from '../email-templates/components/generic-email-layout.js'
import { logger } from '../util/logger'

Accounts.emailTemplates.from = process.env.FROM_EMAIL || 'support@unee-t.com'
Accounts.config({
  sendVerificationEmail: true
})

const getBrandConfig = user => {
  let userCreator
  if (user.profile.creatorId) {
    userCreator = Meteor.users.findOne({ _id: user.profile.creatorId })
    if (!userCreator) logger.warn(`No user found for user's creatorId ${user.profile.creatorId}`)
  }
  return (userCreator && userCreator.customEmailBrandingConfig) || {}
}
const verifyReasonExplanation = 'you have signed up to Unee-T with this email address'
const unsubText = 'If you think you shouldn\'t be receiving this email, kindly let us know at support@unee-t.com'
Accounts.emailTemplates.verifyEmail = {
  subject () {
    return 'Verify Your Email'
  },
  text (user, url) {
    return getText({
      mainContentText: `
Thanks for joining Unee-T!
To verify your account's email address, simply follow the link below.
${url}
`,
      unsubClauseText: unsubText,
      brandConfig: getBrandConfig(user),
      reasonExplanation: verifyReasonExplanation,
      user
    })
  },
  html (user, url) {
    return getHtml({
      mainContentHtml: `
        <p>Thanks for joining Unee-T!</p>
        <p>To verify your account email, simply click the link below.</p>
        <a href=${url}>${url}</a>
      `,
      title: 'Account verification step',
      brandConfig: getBrandConfig(user),
      unsubClauseHtml: `
        <p>${unsubText}</p>
      `,
      reasonExplanation: verifyReasonExplanation,
      user
    })
  }
}

const resetReasonExplanation = 'you have requested to reset your account\'s password'

Accounts.emailTemplates.resetPassword = {
  subject () {
    return 'Reset the password for your Unee-T account'
  },
  text (user, url) {
    return getText({
      mainContentText: `
Set a new password in one more simple step by following this link:
${url}
`,
      unsubClauseText: unsubText,
      brandConfig: getBrandConfig(user),
      reasonExplanation: resetReasonExplanation,
      user
    })
  },
  html (user, url) {
    return getHtml({
      mainContentHtml: `
        <p>Set a new password in one more simple step by clicking on this link:</p>
        <a href=${url}>${url}</a>
      `,
      title: 'Password reset email',
      unsubClauseHtml: `
        <p>${unsubText}</p>
      `,
      brandConfig: getBrandConfig(user),
      reasonExplanation: resetReasonExplanation,
      user
    })
  }
}
