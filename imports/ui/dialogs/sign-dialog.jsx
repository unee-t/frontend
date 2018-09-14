import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Dialog from 'material-ui/Dialog'
import FontIcon from 'material-ui/FontIcon'
import RaisedButton from 'material-ui/RaisedButton'
import { modalTitleStyle, closeDialogButtonStyle, modalBodyStyle } from './generic-dialog.mui-styles'
import { userInfoItem } from '../../util/user'
import SignBox from '../components/sign-box'

class SignDialog extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      signImgUri: ''
    }
  }
  render () {
    const { signingUser, onClose, open, onSignSubmit } = this.props
    const { signImgUri } = this.state
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title='Please sign in the box below'
        titleStyle={modalTitleStyle}
        bodyStyle={modalBodyStyle}
      >
        <a onClick={onClose} className='link b--none bg-transparent absolute top-0 pt3 pr2 right-0 outline-0'>
          <FontIcon className='material-icons' style={closeDialogButtonStyle}>close</FontIcon>
        </a>
        {signingUser && (
          <div>
            {userInfoItem(signingUser)}
          </div>
        )}
        <div className='mt3'>
          <SignBox
            onChange={dataUri => this.setState({signImgUri: dataUri})}
            registerCleanListener={fn => { this.cleanSignature = fn }}
          />
        </div>
        <div className='mt2 gray f7 lh-title'>
          By clicking Submit signature, I agree that the signature will be an electronic representation for use on
          documents including legally binding documents.
        </div>
        <div className='flex justify-end pt1 mt2'>
          <RaisedButton
            onClick={() => {
              this.cleanSignature()
              this.setState({signImgUri: ''})
            }}
          >
            <span className='bondi-blue'>
              Clear
            </span>
          </RaisedButton>
          <RaisedButton
            className='ml2'
            primary
            disabled={signImgUri === ''}
            onClick={() => onSignSubmit(signImgUri)}
          >
            <span className='white ph3'>
              Submit signature
            </span>
          </RaisedButton>
        </div>
      </Dialog>
    )
  }
}

SignDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  signingUser: PropTypes.object,
  onSignSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
}

export default SignDialog
