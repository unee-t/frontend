import React from 'react'
import PropTypes from 'prop-types'

export const infoItemLabel = label => (<div key='label' className='mt1 f6 bondi-blue'>{label}</div>)
export const infoItemMembers = (label, value) => [
  (infoItemLabel(label)),
  (<div key='value' className='mt2 mid-gray lh-copy'>{value}</div>)
]

export const InfoItemContainer = ({ children, additionalClasses = '' }) => (
  <div className={'bb b--gray-93 ph3 pt2 pb3 ' + additionalClasses}>
    {children}
  </div>
)
InfoItemContainer.propTypes = {
  children: PropTypes.any.isRequired,
  additionalClasses: PropTypes.string
}

export const InfoItemRow = ({ label, value }) => (
  <InfoItemContainer>
    {infoItemMembers(label, value)}
  </InfoItemContainer>
)
InfoItemRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.any
}
