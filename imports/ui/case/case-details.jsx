import React from 'react'
import PropTypes from 'prop-types'
import FontIcon from 'material-ui/FontIcon'
import _ from 'lodash'
import themes from '../components/user-themes.mss'
import UserAvatar from '../components/user-avatar'

import { detailLineIconColor } from './case.mui-styles'

const CaseDetails = (props) => {
  const { caseItem, comments } = props
  console.log('props.caseItem', caseItem)
  const { summary, cf_ipi_clust_6_claim_type: claimType } = caseItem
  const participants = _.chain(comments).map('creator').uniq().value()
  return (
    <div>
      <div className='pv1 ph3 mv2 mid-gray'>{summary}</div>
      <div className='bt bb b--gray-93 ph3 gray h2-5 flex items-center'>
        <FontIcon className='material-icons mr4' color={detailLineIconColor}>local_offer</FontIcon>
        <div>{claimType}</div>
      </div>
      <div className='ph3 h2-5 flex items-center'>
        <FontIcon className='material-icons mr4' color={detailLineIconColor}>person</FontIcon>
        <div className='flex'>
          {participants.map((creator, ind) => (
            <div key={ind} className={themes['theme' + ((ind % 10) + 1)]}>
              <UserAvatar creator={creator} isSmall />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

CaseDetails.propTypes = {
  caseItem: PropTypes.object.isRequired,
  comments: PropTypes.array.isRequired
}

export default CaseDetails
