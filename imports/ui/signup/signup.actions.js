// @flow
// import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import routerRedux from 'react-router-redux'
export const SIGNUP_ERROR = 'signup_error'
export const SIGNUP_IN_PROGRESS = 'signup_in_progress'
export const SIGNUP_SUCCESS = 'signup_success'

type Action = {
  type: string
}

type Info = {
  password: string,
  emailAddress: string,
  promoCode: ?string
}

type Dispatch = (action: Action) => any;
type ThunkAction = (dispatch: Dispatch) => any

export function submitSignupInfo (info: Info): ThunkAction {
  const { push } = routerRedux
  return (dispatch: Dispatch) => {
    dispatch({
      type: SIGNUP_IN_PROGRESS
    })
    Accounts.createUser({
      email: info.emailAddress,
      password: info.password,
      profile: {
        promoCode: info.promoCode
      }
    }, (err) => {
      if (err) {
        dispatch({
          type: SIGNUP_ERROR,
          value: err
        })
      } else {
        dispatch({
          type: SIGNUP_SUCCESS
        })
        dispatch(push('/unit'))
      }
    })
  }
}
