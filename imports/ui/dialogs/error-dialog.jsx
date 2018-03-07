import React from 'react'
import PropTypes from 'prop-types'
import Dialog from 'material-ui/Dialog'
import { modalTitleStyle } from './generic-dialog.mui-styles'

const ErrorDialog = ({show, text, onDismissed}) => (
  <Dialog
    title={text}
    titleStyle={modalTitleStyle}
    open={show}
  >
    <div className='tr'>
      <button
        className='button-reset ph3 bg-bondi-blue white br1 b--none pv2 lh-title dim mt3'
        onClick={onDismissed}
      >
        Ok
      </button>
    </div>
  </Dialog>
)

ErrorDialog.propTypes = {
  show: PropTypes.bool.isRequired,
  text: PropTypes.string.isRequired,
  onDismissed: PropTypes.func
}

export default ErrorDialog
