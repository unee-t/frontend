import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import IconButton from 'material-ui/IconButton'
import FontIcon from 'material-ui/FontIcon'
import { isClosed } from '../../api/cases'

import {
  moreIconColor
} from './explorer.mui-styles'

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

export function ItemList ({ allItems, onItemClick, name }) {
  return (
    <div>
      {allItems.map((item, ind) =>
        <li key={item.id} className='h2-5 bt b--black-10'>
          <div className='flex items-center'>
            <Link
              className={
                'link flex-grow ellipsis ml3 pl1 ' +
                  (item.unreadCounts ? 'b ' : '') +
                  (isClosed(item) ? 'silver strike' : 'bondi-blue')
              }
              to={name === 'report' ? (`report/${item.id}/review`) : (`/case/${item.id}`)}
              onClick={onItemClick}
            >
              {item.title}
            </Link>
            {updateCounter('announcement', item.unreadCounts && item.unreadCounts.messages)}
            {updateCounter('assignment_late', item.unreadCounts && item.unreadCounts.updates)}
            <IconButton>
              <FontIcon className='material-icons' color={moreIconColor}>more_horiz</FontIcon>
            </IconButton>
          </div>
        </li>
      )}
    </div>
  )
}

ItemList.propTypes = {
  allItems: PropTypes.array.isRequired,
  onItemClick: PropTypes.func.isRequired
}
