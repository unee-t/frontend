// import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import routerRedux from 'react-router-redux'

export function submitSignupInfo (info) {
  const { push } = routerRedux
  return (dispatch) => {
    Accounts.createUser({
      email: info.emailAddress,
      password: info.password,
      tac: {
        acceptedAt: new Date(),
        version: '08/06/2018'
      },
      profile: {
      }
    }, (err) => {
      if (err) return console.error(err)
      dispatch(push('/unit'))
    })
  }
}
