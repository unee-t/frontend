import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import { createContainer } from 'meteor/react-meteor-data'
import Preloader from '../preloader/preloader'
import { fetchInvitationCredentials, clearErrorMessage } from './invitation-login.actions'
import ErrorDialog from '../components/error-dialog'

class InvitationLogin extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      codeMissing: false
    }
  }
  componentDidMount () {
    const { location, dispatch } = this.props
    const paramMatch = location.search.match(/[?&]code=([^&]+).*$/)
    if (!paramMatch) {
      this.setState({
        codeMissing: true
      })
    } else {
      dispatch(fetchInvitationCredentials(paramMatch[1]))
    }
  }
  handleErrorDismissed = () => {
    const { dispatch } = this.props
    if (!this.state.codeMissing) {
      dispatch(clearErrorMessage())
    }
    dispatch(push('/'))
  }
  render () {
    const { codeMissing } = this.state
    const { error } = this.props
    return (
      <div>
        <Preloader />
        <ErrorDialog
          show={!!error || codeMissing}
          text={error ? error.error : 'Code is missing'}
          onDismissed={this.handleErrorDismissed}
        />
      </div>
    )
  }
}

InvitationLogin.propTypes = {
  error: PropTypes.object
}

export default connect(
  ({ invitationLoginState: { error } }) => ({
    error
  }) // map redux state to props
)(createContainer(() => ({ // map meteor state to props
}), InvitationLogin))
