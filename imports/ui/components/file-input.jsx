// @flow
/* global SyntheticInputEvent, HTMLInputElement */
import * as React from 'react'
import ErrorDialog from '../dialogs/error-dialog'

type Props = {
  children: React.Node,
  acceptTypes?: {
    image: boolean,
    audio: boolean
  },
  onFileSelected: (evt: SyntheticInputEvent<HTMLInputElement>) => void
}

type State = {
  typeError: boolean
}

export default class FileInput extends React.Component<Props, State> {
  state = {
    typeError: false
  }
  handleFileSelected = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    const fileType = evt.target.files[0].type.split('/')[0]
    if (this.allowedTypes.includes(fileType)) {
      this.props.onFileSelected(evt)
    } else {
      evt.preventDefault()
      this.setState({
        typeError: true
      })
    }
  }

  get allowedTypes ():Array<string> {
    const acceptTypes = this.props.acceptTypes || { image: true, audio: false }
    return Object.keys(acceptTypes).filter(type => !!acceptTypes[type])
  }

  render () {
    return (
      <label>
        {this.props.children}
        <input type='file' className='dn' onChange={this.handleFileSelected} />
        <ErrorDialog
          show={this.state.typeError}
          text={`The file type you selected is not supported for this input. The supported type${
            this.allowedTypes.length === 1 ? ` is "${this.allowedTypes[0]}"` : `s are "${this.allowedTypes.join('", "')}"`
          }`}
          onDismissed={() => this.setState({ typeError: false })}
        />
      </label>
    )
  }
}
