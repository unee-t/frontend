import React from 'react'
import PropTypes from 'prop-types'
import RaisedButton from 'material-ui/RaisedButton'
import Dialog from 'material-ui/Dialog'

import {
  modalTitleStyle,
  modalBodyStyle,
  modalCustomContentStyle
} from './generic-dialog.mui-styles'

const confirmationCustomContentStyle = Object.assign({}, modalCustomContentStyle)
delete confirmationCustomContentStyle.transform
const confirmationTitleStyle = Object.assign({}, modalTitleStyle)
delete confirmationTitleStyle.marginRight

const ConfirmationDialog = ({ show, title, onConfirm, onCancel, children, confirmLabel }) => (
  <Dialog
    open={show}
    title={title}
    titleStyle={confirmationTitleStyle}
    bodyStyle={modalBodyStyle}
    contentStyle={confirmationCustomContentStyle}
    onRequestClose={onCancel}
  >
    {children}
    <div className='mt3 flex justify-end'>
      <RaisedButton
        onClick={onCancel}
      >
        <span className='bondi-blue'>
          Cancel
        </span>
      </RaisedButton>
      <RaisedButton
        className='ml3'
        primary
        onClick={onConfirm}
      >
        <div className='white ph3'>
          {confirmLabel || 'Confirm'}
        </div>
      </RaisedButton>
    </div>
  </Dialog>
)

ConfirmationDialog.propTypes = {
  show: PropTypes.bool.isRequired,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  confirmLabel: PropTypes.string
}

export default ConfirmationDialog
