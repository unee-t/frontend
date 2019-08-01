// @flow
/* global File */
import * as React from 'react'
import RaisedButton from 'material-ui/RaisedButton'
import Dialog from 'material-ui/Dialog'
import MenuItem from 'material-ui/MenuItem'

import { resetMenuItemDivStyle } from '../general.mui-styles'
import FileInput from '../components/file-input'
import { UploadIcon } from '../components/generic-icons'
import { fileInputReaderEventHandler } from '../util/dom-api'
import {
  modalTitleStyle,
  modalBodyStyle,
  modalCustomContentStyle
} from './generic-dialog.mui-styles'

type Props = {
  show: boolean,
  title: string,
  onConfirm: (file: File) => void,
  onClose: () => void
}

type State = {
  uploadPreview: ?string
}

class ChangeLogoDialog extends React.Component<Props, State> {
  uploadedFile: ?File
  state = {
    uploadPreview: null
  }

  handleClose = () => {
    this.uploadedFile = null
    this.setState({
      uploadPreview: null
    })
    this.props.onClose()
  }

  handleConfirm = () => {
    const file = this.uploadedFile
    this.uploadedFile = null
    this.setState({
      uploadPreview: null
    })
    if (file) {
      this.props.onConfirm(file)
    }
  }

  handleFileSelected = fileInputReaderEventHandler(
    (preview: string, file: File) => {
      this.uploadedFile = file
      this.setState({
        uploadPreview: preview
      })
    }
  )

  render () {
    const { show, title } = this.props
    const { uploadPreview } = this.state
    return (
      <Dialog
        open={show}
        title={title}
        titleStyle={modalTitleStyle}
        bodyStyle={modalBodyStyle}
        contentStyle={modalCustomContentStyle}
        onRequestClose={this.handleClose}
      >
        <div className='ma-auto'>
          <div className='ba b--moon-gray b--dashed'>
            {uploadPreview ? (
              <div className='w5 h5 relative'>
                <img src={uploadPreview} className='w-100 h-100 obj-contain' />
                <div className='absolute top-0 right-0 pa2'>
                  <FileInput onFileSelected={this.handleFileSelected}>
                    <div className='bg-black-70 br2 white pa2 lh-title f6 b flex items-center'>
                      <UploadIcon fillColor='white' />
                      <div className='ml1'>
                        Change logo
                      </div>
                    </div>
                  </FileInput>
                </div>
              </div>
            ) : (
              <MenuItem innerDivStyle={resetMenuItemDivStyle}>
                <FileInput onFileSelected={this.handleFileSelected}>
                  <div className='h5 w5 flex flex-column items-center justify-center'>
                    <div className='flex items-end'>
                      <UploadIcon fillColor='var(--bondi-blue)' style={{ width: '35px', height: '35px' }} />
                      <div className='bondi-blue f5 tc ml1 fw5 lh-copy'>
                        Upload File
                      </div>
                    </div>
                    <div className='semi-dark-gray tc f7 mt2 lh-title'>
                      <div>
                        JPG, PNG, GIF or SVG file
                      </div>
                      <div>
                        <span className='b'>Recommended dimensions: </span>
                        200px by 200px
                      </div>
                    </div>
                  </div>
                </FileInput>
              </MenuItem>
            )}
          </div>
        </div>
        <div className='mt3 flex justify-end'>
          <RaisedButton
            onClick={this.handleClose}
          >
            <span className='bondi-blue'>
              Cancel
            </span>
          </RaisedButton>
          <RaisedButton
            className='ml3'
            primary
            disabled={!uploadPreview}
            onClick={this.handleConfirm}
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
