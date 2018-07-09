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
        bzLogin: info.bzLogin,
        bzPass: info.bzPass
      }
    }, (err) => {
      if (err) return console.error(err)
      dispatch(push('/case'))
    })
  }
}
