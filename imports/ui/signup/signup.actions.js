// import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import routerRedux from 'react-router-redux'

export function submitSignupInfo (info) {
  const { push } = routerRedux
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
