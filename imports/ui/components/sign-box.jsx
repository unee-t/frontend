import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SignaturePad from 'signature_pad'

class SignBox extends Component {
  componentDidMount () {
    const { onChange, registerCleanListener } = this.props
    this.signaturePad = new SignaturePad(this.refs.canvas, {
      onEnd: () => {
        onChange(this.signaturePad.toDataURL())
      },
      backgroundColor: 'rgb(255, 255, 255)'
    })

    registerCleanListener(() => {
      this.signaturePad.clear()
    })
  }

  render () {
    return (
      <div className='ba b--moon-gray pa2'>
        <canvas className='w-100 bb b--silver' ref='canvas' />
      </div>
    )
  }
}

SignBox.propTypes = {
  onChange: PropTypes.func.isRequired,
  registerCleanListener: PropTypes.func.isRequired
}

export default SignBox
