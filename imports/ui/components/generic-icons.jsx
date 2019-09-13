// @flow
import * as React from 'react'
import SvgIcon from 'material-ui/SvgIcon'

type Props = {
  fillColor?: string
}

export class UploadIcon extends React.Component<Props> {
  render () {
    const { fillColor, ...otherProps } = this.props
    return (
      <SvgIcon {...otherProps} viewBox='0 0 24 24'>
        <path fill={fillColor || '#000'} d='M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z' />
      </SvgIcon>
    )
  }
}

export class MarkerIcon extends React.Component<Props> {
  render () {
    const { fillColor, ...otherProps } = this.props
    return (
      <SvgIcon {...otherProps} viewBox='0 0 14 20'>
        <path fill={fillColor || '#000'} d='M7 0C3.14 0 0 3.14 0 7C0 12.25 7 20 7 20C7 20 14 12.25 14 7C14 3.14 10.86 0 7 0ZM5.44 10H4V8.56L7.35 5.22L8.78 6.65L5.44 10ZM9.89 5.55L9.19 6.25L7.75 4.81L8.45 4.11C8.6 3.96 8.84 3.96 8.99 4.11L9.89 5.01C10.04 5.16 10.04 5.4 9.89 5.55Z' />
      </SvgIcon>
    )
  }
}
