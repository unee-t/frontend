import React from 'react'
import PropTypes from 'prop-types'
import IconButton from 'material-ui/IconButton'
import FontIcon from 'material-ui/FontIcon'
import moment from 'moment'
import { formatDayText } from '../../util/formatters'

const MaximizedAttachment = ({creatorText, creationTime, attachmentUrl, onBack}) => {
  const timeText = `${formatDayText(creationTime)}, ${moment(creationTime).format('HH:mm')}`
  return (
    <div className='flex items-center full-height roboto bg-black'>
      <div className='fixed top-0 w-100 bg-black-20 flex items-center'>
        <IconButton onClick={onBack}>
          <FontIcon className='material-icons' color='white'>arrow_back</FontIcon>
        </IconButton>
        <div className='white'>
          <h4 className='mv1'>{creatorText}</h4>
          <h5 className='mv1'>{timeText}</h5>
        </div>
      </div>
      <img className='w-100' src={attachmentUrl} alt='Image failed to load' />
    </div>
  )
}

MaximizedAttachment.propTypes = {
  creatorText: PropTypes.string.isRequired,
  creationTime: PropTypes.string.isRequired,
  attachmentUrl: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired
}

export default MaximizedAttachment
