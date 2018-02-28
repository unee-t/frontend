import React from 'react'
import SvgIcon from 'material-ui/SvgIcon'
import PropTypes from 'prop-types'

export const UneeTIcon = ({isDarkType, ...otherProps}) => (
  <SvgIcon {...otherProps} viewBox={isDarkType ? '0 0 119.19 119.33' : '3 3 39 39'}>
    <use xlinkHref={`/unee-t_logo${isDarkType ? '' : '_reverse'}.svg#icon`} />
  </SvgIcon>
)

UneeTIcon.propTypes = {
  isDarkType: PropTypes.bool
}

const UneeTLogoTextStyle = {
  width: 106,
  height: 27
}
export const UneeTLogoText = props => (
  <SvgIcon viewBox='0 0 106 27' style={UneeTLogoTextStyle} {...props}>
    <use xlinkHref='/unee-t_wordmark.svg#logo-text' />
  </SvgIcon>
)
