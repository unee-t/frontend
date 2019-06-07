import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import IconButton from 'material-ui/IconButton'
import FontIcon from 'material-ui/FontIcon'
import { isClosed } from '../../api/cases'

import {
  moreIconColor
} from './case-explorer.mui-styles'

const updateCounter = (iconType, count) => {
  if (!count) return null
  return (
    <div className='relative mr3'>
      <FontIcon className='material-icons' color='var(--warn-crimson)'>{iconType}</FontIcon>
      <div className='absolute bottom-0 left-1'>
        <div className='br-pill bg-white-70 h1 f7 mid-gray ph1'>
          {count}
        </div>
      </div>
    </div>
  )
}

export function CaseList ({ allCases }) {
  return (
    <div>
      {allCases.map(caseItem =>
        <li key={caseItem.id} className='h2-5 bb b--black-10'>
          <div className='flex items-center'>
            <Link
              className={
                'link flex-grow ellipsis ml3 pl1 ' +
                  (caseItem.unreadCounts ? 'b ' : '') +
                  (isClosed(caseItem) ? 'silver strike' : 'bondi-blue')
              }
              to={`/case/${caseItem.id}`}
            >
              {caseItem.title}
            </Link>
            {updateCounter('announcement', caseItem.unreadCounts && caseItem.unreadCounts.messages)}
            {updateCounter('assignment_late', caseItem.unreadCounts && caseItem.unreadCounts.updates)}
            <IconButton>
              <FontIcon className='material-icons' color={moreIconColor}>more_horiz</FontIcon>
            </IconButton>
          </div>
        </li>
      )}
    </div>
  )
}

CaseList.propTypes = {
  allCases: PropTypes.array.isRequired
}
