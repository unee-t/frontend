import React, { Component } from 'react'
import PropTypes from 'prop-types'
import FlatButton from 'material-ui/FlatButton'
import FontIcon from 'material-ui/FontIcon'
import Popover from 'material-ui/Popover'

export default class PopoverButton extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      popoverOpen: false,
      popoverWidth: 100,
      popoverMaxHeight: 1000
    }
    window.addEventListener('resize', this.handleWindowResize)
  }
  componentWillUnmount () {
    window.removeEventListener('resize', this.handleWindowResize)
  }
  handleWindowResize = () => {
    this.setState({
      popoverMaxHeight: this.containerEl.offsetHeight - 38
    })
  }
  handleOpen = evt => {
    evt.preventDefault()
    this.setState({
      popoverOpen: true,
      buttonEl: evt.currentTarget,
      popoverWidth: evt.currentTarget.offsetWidth
    })
  }
  render () {
    const { popoverOpen, buttonEl, popoverWidth, popoverMaxHeight } = this.state
    return (
      <div className='w-100 overflow-hidden' ref={el => { this.containerEl = el }}>
        <FlatButton style={{ height: 'auto', width: '100%' }} onClick={this.handleOpen}>
          <div className='flex ph2 ba b--moon-gray br2 items-center'>
            <div className='mid-gray flex-grow ellipsis tl'>{this.props.buttonText}</div>
            <FontIcon className='material-icons' color='var(--mid-gray)'>
              {popoverOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
            </FontIcon>
          </div>
        </FlatButton>
        <div className='h5' />
        <div className='h2-5' />
        <Popover open={popoverOpen} anchorEl={buttonEl}
          anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
          targetOrigin={{ horizontal: 'left', vertical: 'top' }}
          onRequestClose={() => this.setState({ popoverOpen: false })}
          style={{ width: popoverWidth, marginTop: -1 }}
        >
          <div className='w-100 flex flex-column' style={{ maxHeight: popoverMaxHeight }}>
            {this.props.children}
          </div>
        </Popover>
      </div>
    )
  }
}

PopoverButton.propTypes = {
  buttonText: PropTypes.string.isRequired
}
