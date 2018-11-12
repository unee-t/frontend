// @flow
import * as React from 'react'
import RaisedButton from 'material-ui/RaisedButton'
import Dialog from 'material-ui/Dialog'
import FontIcon from 'material-ui/FontIcon'
import MenuItem from 'material-ui/MenuItem'

import { resetMenuItemDivStyle } from '../general.mui-styles'
import FileInput from '../components/file-input'
import { imageInputEventHandler } from '../util/dom-api'
import {
  modalTitleStyle,
  modalBodyStyle,
  modalCustomContentStyle
} from './generic-dialog.mui-styles'

type Props = {
  show: boolean,
  title: string,
  onConfirm: () => void,
  onClose: () => void
}

type State = {
  uploadedPreview: any
}

class ChangeLogoDialog extends React.Component<Props, State> {
  uploadedFile: any
  state = {
    uploadPreview: null
  }

  render () {
    const { show, title, onClose, onConfirm } = this.props
    const { uploadPreview } = this.state
    return (
      <Dialog
        open={show}
        title={title}
        titleStyle={modalTitleStyle}
        bodyStyle={modalBodyStyle}
        contentStyle={modalCustomContentStyle}
        onRequestClose={onClose}
      >
        <div className='ma-auto'>
          <div className='ba b--moon-gray b--dashed'>
            {uploadPreview ? (
              <div className='w5 h5'>
                <img src={uploadPreview} className='w-100 h-100 obj-contain' />
              </div>
            ) : (
              <MenuItem innerDivStyle={resetMenuItemDivStyle}>
                <FileInput onFileSelected={imageInputEventHandler(
                  (preview, file) => {
                    this.uploadedFile = file
                    this.setState({
                      uploadPreview: preview
                    })
                  }
                )}>
                  <div className='h5 w5 flex flex-column items-center justify-center'>
                    <FontIcon className='material-icons' color='var(--bondi-blue)'>
                      add_photo_alternate
                    </FontIcon>
                    <div className='bondi-blue f6 tc mt2 fw5'>
                      Upload File
                    </div>
                  </div>
                </FileInput>
              </MenuItem>
            )}
          </div>
        </div>
        <div className='mt3 flex justify-end'>
          <RaisedButton
            onClick={onClose}
          >
            <span className='bondi-blue'>
              Cancel
            </span>
          </RaisedButton>
          <RaisedButton
            className='ml3'
            primary
            disabled={!uploadPreview}
            onClick={onConfirm}
          >
            <span className='white'>
              Done
            </span>
          </RaisedButton>
        </div>
      </Dialog>
    )
  }
}

export default ChangeLogoDialog
