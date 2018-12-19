import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { REPORT_DRAFT_STATUS } from '../../api/reports'

export function ReportList ({ allReports }) {
  return (
    <div>
      {allReports.map((reportItem, ind) =>
        <li key={reportItem.id} className='h2-5 bt b--black-10'>
          <div className='flex items-center'>
            <Link
              className={'link flex-grow ellipsis ml3 pl1 pv3 bondi-blue'}
              to={`report/${reportItem.id}/${reportItem.status === REPORT_DRAFT_STATUS ? 'draft' : 'preview'}`}
            >
              {reportItem.title}
            </Link>
          </div>
        </li>
      )}
    </div>
  )
}

ReportList.propTypes = {
  allReports: PropTypes.array.isRequired
}
