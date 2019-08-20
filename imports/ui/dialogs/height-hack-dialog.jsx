// @flow
// global setTimeout
import * as React from 'react'
import Dialog from 'material-ui/Dialog'

type Props = {
  padding: number,
  title?: ?string,
  titleStyle?: Object,
  modal?: boolean,
  open: boolean,
  bodyStyle?: Object,
  contentStyle?: Object,
  children: React.Node,
  onHeightChange?: (val: number) => void,
  onRequestClose: (cb: () => void) => void
}
type State = {
  currMaxHeight: number
}

export default class HeightHackDialog extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      currMaxHeight: window.innerHeight - props.padding
    }
    setTimeout(() => {
      props.onHeightChange && props.onHeightChange(window.innerHeight - props.padding)
    })
    window.addEventListener('resize', this.handleWindowResize)
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.handleWindowResize)
  }

  handleWindowResize = () => {
    const { onHeightChange } = this.props
    this.setState({
      currMaxHeight: window.innerHeight - this.props.padding
    })
    onHeightChange && onHeightChange(window.innerHeight - this.props.padding)
  }

  render () {
    const {
      children,
      title,
      titleStyle,
      contentStyle,
      bodyStyle = {},
      modal = false,
      open,
      onRequestClose
    } = this.props
    const { currMaxHeight } = this.state
    return (
      <Dialog
        {...{ title, titleStyle, contentStyle, modal, open, onRequestClose }}
        bodyStyle={Object.assign({ maxHeight: currMaxHeight }, bodyStyle)}
        autoDetectWindowHeight={false}
      >
        {children}
      </Dialog>
    )
  }
}
