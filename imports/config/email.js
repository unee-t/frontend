import { Accounts } from 'meteor/accounts-base'

Accounts.emailTemplates.from = process.env.FROM_EMAIL || 'support@unee-t.com'
Accounts.config({
  sendVerificationEmail: true
})

Accounts.emailTemplates.verifyEmail = {
  subject () {
    return 'Verify Your Email'
  },
  text (user, url) {
    return `Thanks for joining Unee-T!

To verify your account email, simply click the link below.

${url}

Thanks,
The Unee-T Team`
  },
  html (user, url) {
    return `<img src="https://s3-ap-southeast-1.amazonaws.com/prod-media-unee-t/2018-06-14/unee-t_logo_email.png"><p>Thanks for joining Unee-T!</p>

<p>To verify your account email, simply click the link below.</p>

<a href=${url}>${url}</a>

<p>Thanks,<br>
The Unee-T Team</p>`
  }
}
