// import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import routerRedux from 'react-router-redux'
export const SIGNUP_ERROR = 'signup_error'

export function submitSignupInfo (info) {
  const { push } = routerRedux
  return (dispatch) => {
    Accounts.createUser({
      email: info.emailAddress,
      password: info.password,
      profile: {
      }
    }, (err) => {
      if (err) {
        dispatch({
          type: SIGNUP_ERROR,
          value: err
        })
      } else {
        dispatch(push('/unit'))
      }
    })
  }
}
