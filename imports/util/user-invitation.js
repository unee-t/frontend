import { Accounts } from 'meteor/accounts-base'

export function inviteUser (emailAddress, caseId, unitId, role) {
  // TODO: Handle the scenario in which the user already exists for this email

  // Using Meteor accounts package to create the user with no signup
  Accounts.createUser({
    email: emailAddress,
    profile: {
      invitedToCase: {
        caseId,
        role,
        unitId
      }
    }
  })
  const user = Accounts.findUserByEmail(emailAddress)

  // Using the accounts package to email the magic link to the user
  Accounts.sendEnrollmentEmail(user._id)
}
