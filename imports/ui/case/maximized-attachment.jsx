import React from 'react'
import PropTypes from 'prop-types'

const MaximizedAttachment = ({ attachmentUrl }) => (
  <div className='flex items-center full-height roboto bg-black'>
    <img className='w-100' src={attachmentUrl} alt='Image failed to load' />
  </div>
)

MaximizedAttachment.propTypes = {
  attachmentUrl: PropTypes.string.isRequired
}

export default MaximizedAttachment
