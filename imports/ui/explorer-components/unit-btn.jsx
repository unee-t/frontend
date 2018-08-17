import React from 'react'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import FontIcon from 'material-ui/FontIcon'
import { push } from 'react-router-redux'

export function UnitBtn ({dispatch}) {
  return (
    <div className='absolute right-1 bottom-2'>
      <FloatingActionButton onClick={() => dispatch(push('/unit'))}>
        <FontIcon className='material-icons'>add</FontIcon>
      </FloatingActionButton>
    </div>
  )
}