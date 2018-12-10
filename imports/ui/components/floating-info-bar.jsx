// @flow
import * as React from 'react'
import IconButton from 'material-ui/IconButton'
import FontIcon from 'material-ui/FontIcon'

type Props = {
  handleBack: () => void,
  children: React.Node
}

export default class FloatingInfoBar extends React.Component<Props> {
  render () {
    const { children, handleBack } = this.props
    return (
      <div className='fixed top-0 w-100 bg-black-20 flex items-center z-999'>
        <IconButton onClick={handleBack}>
          <FontIcon className='material-icons' color='white'>arrow_back</FontIcon>
        </IconButton>
        {children}
      </div>
    )
  }
}
