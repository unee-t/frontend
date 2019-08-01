// @flow
/* global SyntheticInputEvent, HTMLInputElement */
import * as React from 'react'

type Props = {
  children: React.Node,
  acceptTypes?: {
    image: boolean,
    audio: boolean
  },
  onFileSelected: (evt: SyntheticInputEvent<HTMLInputElement>) => void
}

export default class FileInput extends React.Component<Props> {
  render () {
    const acceptTypes = this.props.acceptTypes || { image: true, audio: false }
    let acceptStrs = []
    if (acceptTypes) {
      acceptStrs.push('audio/*')
    }
    if (acceptTypes.image) {
      acceptStrs.push('image/*')
    }

    return (
      <label>
        {this.props.children}
        <input type='file' accept={acceptStrs.join(', ')} capture='filesystem' className='dn' onChange={this.props.onFileSelected} />
      </label>
    )
  }
}
