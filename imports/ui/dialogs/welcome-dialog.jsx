// nbiton- deprecated on Jan 4 2018. Remove if it remains this way for a long time

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Dialog from 'material-ui/Dialog'
import FontIcon from 'material-ui/FontIcon'
import TextField from 'material-ui/TextField'
import RaisedButton from 'material-ui/RaisedButton'
import UneeTIcon from '../components/unee-t-icon'

import { closeDialogButtonStyle, modalBodyStyle } from './generic-dialog.mui-styles'
import {
  textInputFloatingLabelStyle,
  textInputStyle,
  textInputUnderlineFocusStyle
} from '../components/form-controls.mui-styles'

class WelcomeDialog extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      firstName: '',
      lastName: ''
    }
  }
  render () {
    const {
      show,
      onDismissed,
      onNameSubmitted,
      invitedByDetails,
      caseItem: { id: caseId, summary: caseSummary },
      unitItem: { name: unitName }
    } = this.props
    const {
      firstName,
      lastName
    } = this.state
    return (
      <Dialog
        open={show}
        modal
        bodyStyle={modalBodyStyle}
      >
        <button onClick={onDismissed}
          className='button b--none bg-transparent absolute top-1 pt2 right-1 outline-0'
        >
          <FontIcon className='material-icons' style={closeDialogButtonStyle}>close</FontIcon>
        </button>
        <div className='pt3 overflow-auto'>
          <div className='tc'>
            <UneeTIcon isDarkType style={{ width: 67, height: 67 }} />
            <div className='mt2 pt1 bondi-blue f3 fw5'>
              Welcome to Unee&#8209;T!
            </div>
          </div>
          <div className='lh-copy mt2 pt1'>
            {invitedByDetails ? invitedByDetails.name : ''} has invited you to collaborate on the case&nbsp;
            <span className='b'>
            "#{caseId} - {caseSummary}"
            </span>
            &nbsp;in&nbsp;
            <span className='b'>
              {unitName}
            </span>
            <br />
            <br />
            Let's enter your name to begin...
          </div>
          <TextField
            floatingLabelText='First name'
            fullWidth
            floatingLabelShrinkStyle={textInputFloatingLabelStyle}
            inputStyle={textInputStyle}
            underlineFocusStyle={textInputUnderlineFocusStyle}
            onChange={e => this.setState({
              firstName: e.target.value
            })}
            value={firstName}
          />
          <TextField
            floatingLabelText='Last name'
            fullWidth
            floatingLabelShrinkStyle={textInputFloatingLabelStyle}
            inputStyle={textInputStyle}
            underlineFocusStyle={textInputUnderlineFocusStyle}
            onChange={e => this.setState({
              lastName: e.target.value
            })}
            value={lastName}
          />
          <div className='mt3'>
            <RaisedButton
              backgroundColor='var(--bondi-blue)'
              disabled={!firstName || !lastName}
              onClick={() => onNameSubmitted([firstName, lastName].join(' '))}
            >
              <span className='white f5 fw5'>
                Join case
              </span>
            </RaisedButton>
          </div>
        </div>
      </Dialog>
    )
  }
}

WelcomeDialog.propTypes = {
  show: PropTypes.bool.isRequired,
  onDismissed: PropTypes.func.isRequired,
  onNameSubmitted: PropTypes.func.isRequired,
  caseItem: PropTypes.object.isRequired,
  unitItem: PropTypes.object.isRequired,
  invitedByDetails: PropTypes.object
}

export default WelcomeDialog
