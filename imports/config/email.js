import { Accounts } from 'meteor/accounts-base'

Accounts.emailTemplates.from = process.env.FROM_EMAIL || 'support@unee-t.com'
