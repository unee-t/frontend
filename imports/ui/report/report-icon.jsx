import React from 'react'
import FontIcon from 'material-ui/FontIcon'

export function ReportIcon ({ isFinalized }) {
  return (
    <div className='dib relative flex items-center'>
      <FontIcon className='material-icons' color='var(--mid-gray)'>
        content_paste
      </FontIcon>
      <div className='absolute bottom-0 right-0'>
        <div className='br-100 bg-white lh-cram'>
          <FontIcon
            className='material-icons'
            color={isFinalized ? 'var(--success-green)' : 'var(--bondi-blue)'}
            style={{ fontSize: '0.75rem' }}
          >
            {isFinalized ? 'check_circle' : 'watch_later'}
          </FontIcon>
        </div>
      </div>
    </div>
  )
}
