import React from 'react'
import FontIcon from 'material-ui/FontIcon'

const docIconStyle = {
  fontSize: '40px'
}

export default () => (
  <div className='relative dib'>
    <FontIcon className='icon-doc' color='var(--gray)' style={docIconStyle} />
    <div className='absolute bottom-0 right-0 pb1 pr2 gray f7'>
      PDF
    </div>
  </div>
)
