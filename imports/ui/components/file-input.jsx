// @flow
/* global SyntheticInputEvent, HTMLInputElement */
import * as React from 'react'

type Props = {
  children: React.Node,
  onFileSelected: (evt: SyntheticInputEvent<HTMLInputElement>) => void
}

export default class FileInput extends React.Component<Props> {
  render () {
    return (
      <label>
        {this.props.children}
        <input type='file' className='dn' onChange={this.props.onFileSelected} />
      </label>
    )
  }
}
