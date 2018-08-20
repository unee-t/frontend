import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import IconButton from 'material-ui/IconButton'
import FontIcon from 'material-ui/FontIcon'
import {
  moreIconColor
} from '../case-explorer/case-explorer.mui-styles'

export function ReportList ({ allReports, onItemClick }) {
  return (
    <div>
      {allReports.map((reportItem, ind) =>
        <li key={reportItem.id} className='h2-5 bt b--black-10'>
          <div className='flex items-center'>
            <Link
              className={'link flex-grow ellipsis ml3 pl1 bondi-blue'}
              to={`report/${reportItem.id}/review`}
              onClick={onItemClick}
            >
              {reportItem.title}
            </Link>
            <IconButton>
              <FontIcon className='material-icons' color={moreIconColor}>more_horiz</FontIcon>
            </IconButton>
          </div>
        </li>
      )}
    </div>
  )
}

ReportList.propTypes = {
  allReports: PropTypes.array.isRequired,
  onItemClick: PropTypes.func.isRequired
}
