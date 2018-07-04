import React from 'react'
import { Link } from 'react-router-dom'
import IconButton from 'material-ui/IconButton'
import FontIcon from 'material-ui/FontIcon'
import { isClosed } from '../../api/cases'

import {
  moreIconColor
} from './case-explorer.mui-styles'

export function CaseList (props) {
  return (
    <div>
      {props.allCases.map(caseItem =>
        <li key={caseItem.id} className='h2-5 bt b--black-10'>
          <div className='flex items-center'>
            <Link
              className={
                'link flex-grow ellipsis ml3 pl1 ' +
                  (isClosed(caseItem) ? 'silver strike' : 'bondi-blue')
              }
              to={`/case/${caseItem.id}`}
              onClick={() => this.props.onItemClick}
            >
              {caseItem.title}
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
