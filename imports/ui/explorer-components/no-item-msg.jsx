import React from 'react'
import FontIcon from 'material-ui/FontIcon'
import PropTypes from 'prop-types'

export function NoItemMsg ({item, iconType, buttonOption}) {
  return (
    <div className='flex-grow flex flex-column items-center justify-center'>
      <div className='tc'>
        <div className='dib relative'>
          <FontIcon className='material-icons' color='var(--moon-gray)' style={{fontSize: '6rem'}}>
            {iconType}
          </FontIcon>
          <div className='absolute bottom--1 right--1 pb2'>
            <div className='br-100 pa1 bg-very-light-gray lh-cram'>
              <FontIcon className='material-icons' color='var(--moon-gray)' style={{fontSize: '2.5rem'}}>
                add_circle
              </FontIcon>
            </div>
          </div>
        </div>
        <div className='mt3 ph4'>
          <div className='mid-gray b lh-copy'>
            <div>There are no {item}s that match your current filter combination.</div>
            {buttonOption &&
              <div>Click on the "+" button to select a unit to add a new {item}</div>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

NoItemMsg.propTypes = {
  item: PropTypes.string,
  buttonOption: PropTypes.bool
}
