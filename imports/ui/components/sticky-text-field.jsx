import React, { Component } from 'react'
import PropTypes from 'prop-types'
import TextField from 'material-ui/TextField'

class StickyTextField extends Component {
  constructor () {
    super(...arguments)
    this.state = {}
  }

  handleScrollToElInit = el => {
    if (this.scrollToEl) {
      this.scrollToEl.removeEventListener('focus', this.handleScrollToElFocus)
      this.scrollToEl.removeEventListener('blur', this.handleScrollToElBlur)
      this.scrollToEl = null
    }
    if (el) {
      this.scrollToEl = el.getInputNode()
      this.scrollToEl.addEventListener('focus', this.handleScrollToElFocus)
      this.scrollToEl.addEventListener('blur', this.handleScrollToElBlur)
    }
  }

  handleScrollToElFocus = () => {
    if (!this.waitingForResize) {
      this.waitingForResize = true
      window.addEventListener('resize', this.handleWindowResizedWhileFocused)
    }
  }

  handleScrollToElBlur = () => {
    if (this.waitingForResize) {
      this.waitingForResize = false
      window.removeEventListener('resize', this.handleWindowResizedWhileFocused)
    }
  }

  handleWindowResizedWhileFocused = () => {
    if (this.waitingForResize) {
      this.waitingForResize = false
      window.removeEventListener('resize', this.handleWindowResizedWhileFocused)
      const scrollContainer = (function getScrollParent (node) {
        if (!node) return null
        if (node.scrollHeight > node.clientHeight) {
          return node
        } else {
          return getScrollParent(node.parentNode)
        }
      })(this.scrollToEl)
      const initialScrollPos = scrollContainer ? scrollContainer.scrollTop : -1
      if (this.scrollToEl.scrollIntoViewIfNeeded) { // Supported in mobile chrome and Safari
        this.scrollToEl.scrollIntoViewIfNeeded(true)
      } else {
        this.scrollToEl.scrollIntoView(false)
      }

      if (scrollContainer && initialScrollPos !== scrollContainer.scrollTop) {
        scrollContainer.scrollTop += 10 // some scroll padding to include the periphery of the input
      }
    }
  }

  setRef = el => {
    this.props.inpRef && this.props.inpRef(el)
    this.handleScrollToElInit(el)
  }

  render () {
    const { inpRef, ...props } = this.props
    return (
      <TextField {...props} ref={this.setRef} />
    )
  }
}

StickyTextField.propTypes = {
  inpRef: PropTypes.func
}

export default StickyTextField
