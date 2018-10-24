import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import FontIcon from 'material-ui/FontIcon'

import themes from './user-themes.mss'

const addPersonIconStyle = {
  color: '#a4a4a4',
  fontSize: 16,
  lineHeight: '1.7rem',
  marginRight: '0.25rem'
}

const AddUserControlLine = props => (
  <div className='flex items-center'>
    <div className={classNames(themes.sized, themes.size1, 'br-100 ba b--moon-gray bg-transparent tc')}>
      <FontIcon className='material-icons' style={addPersonIconStyle}>person_add</FontIcon>
    </div>
    <div className='ml2 pl1 bondi-blue'>{props.instruction}</div>
  </div>
)

AddUserControlLine.propTypes = {
  instruction: PropTypes.string.isRequired
}

export default AddUserControlLine
