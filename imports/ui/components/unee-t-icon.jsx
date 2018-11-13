import React from 'react'
import SvgIcon from 'material-ui/SvgIcon'
import PropTypes from 'prop-types'

const UneeTIcon = ({ isDarkType, ...otherProps }) => (
  <SvgIcon {...otherProps} viewBox={isDarkType ? '0 0 119.19 119.33' : '3 3 39 39'}>
    <use xlinkHref={`/unee-t_logo${isDarkType ? '' : '_reverse'}.svg#icon`} />
  </SvgIcon>
)

UneeTIcon.propTypes = {
  isDarkType: PropTypes.bool
}

export default UneeTIcon
