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
