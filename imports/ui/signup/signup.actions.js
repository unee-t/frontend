// import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import { push } from 'react-router-redux'

export function submitSignupInfo (info) {
  return (dispatch) => {
    Accounts.createUser({
      email: info.emailAddress,
      password: info.password,
      profile: {
        phone: info.phoneNumber,
        name: info.fullName,
        country: info.country
      }
    }, (err) => {
      if (err) return console.error(err)
      dispatch(push('/unit/new'))
    })
  }
}
