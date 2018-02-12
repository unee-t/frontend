import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Meteor } from 'meteor/meteor'
import { createContainer } from 'meteor/react-meteor-data'
import { push } from 'react-router-redux'
import Preloader from '../preloader/preloader'

const InvitationLogin = ({codeExists, loginCompleted}) => {
  if (!codeExists) return <h1>code is missing</h1>
  if (!loginCompleted) return <Preloader />
  return <span>You shouldn't be seeing this</span>
}

InvitationLogin.propTypes = {
  codeExists: PropTypes.bool.isRequired,
  loginCompleted: PropTypes.bool.isRequired
  // targetCaseId: PropTypes.number
}

let loginCompleted = false
const loadInvitationDetails = (() => {
  let isLoading = false
  return (code, dispatch) => {
    if (!isLoading) {
      isLoading = true
      Meteor.call('users.invitationLogin', code, (err, res) => {
        if (err) console.log('err', err)
        Meteor.loginWithPassword(res.email, res.pw, err => {
          if (err) return console.log('invitation login err', err)
          dispatch(push(`/case/${res.caseId}`))
        })
        loginCompleted = true
      })
    }
  }
})()

export default connect(
  (state) => ({}) // map redux state to props
)(createContainer(({location, dispatch}) => { // map meteor state to props
  const paramMatch = location.search.match(/[?&]code=([^&]+).*$/)
  if (paramMatch) {
    loadInvitationDetails(paramMatch[1], dispatch)
  }
  return {
    codeExists: !!paramMatch,
    loginCompleted
  }
}, InvitationLogin))
