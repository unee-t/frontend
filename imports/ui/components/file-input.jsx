import React from 'react'
import PropTypes from 'prop-types'

const FileInput = props => (
  <label>
    {props.children}
    <input type='file' className='dn' onChange={props.onFileSelected} />
  </label>
)

FileInput.propTypes = {
  onFileSelected: PropTypes.func.isRequired
}

export default FileInput
