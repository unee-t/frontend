import React from 'react'
import PropTypes from 'prop-types'
import MenuItem from 'material-ui/MenuItem'
import FontIcon from 'material-ui/FontIcon'

import { isClosed } from '/imports/api/cases'

const severityIcons = {
  'DEAL BREAKER!': {
    icon: 'format_align_justify',
    color: 'var(--warn-crimson)'
  },
  'critical': {
    icon: 'reorder',
    color: '#F00000'
  },
  'major': {
    icon: 'dehaze',
    color: '#FF6701'
  },
  'normal': {
    icon: 'drag_handle',
    color: '#4A90E2'
  },
  'minor': {
    icon: 'remove',
    color: '#99CC33'
  }
}

const menuItemDivStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: 0
}

const CaseMenuItem = ({ caseItem, onClick, className = '' }) => {
  const { severity, title } = caseItem
  return (
    <div className={'bb b--very-light-gray bg-white ' + className}>
      <MenuItem
        innerDivStyle={menuItemDivStyle}
        onClick={onClick}
      >
        <FontIcon className='material-icons mr2' color={severityIcons[severity].color}>
          {severityIcons[severity].icon}
        </FontIcon>
        <span
          className={'pl1 ellipsis ' + (isClosed(caseItem) ? 'silver strike' : 'bondi-blue')}
        >
          {title}
        </span>
      </MenuItem>
    </div>
  )
}

CaseMenuItem.propTypes = {
  caseItem: PropTypes.object.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string
}

export default CaseMenuItem
