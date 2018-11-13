import React from 'react'
import SvgIcon from 'material-ui/SvgIcon'
import PropTypes from 'prop-types'

export const UneeTIcon = ({ isDarkType, ...otherProps }) => (
  <SvgIcon {...otherProps} viewBox={isDarkType ? '0 0 119.19 119.33' : '3 3 39 39'}>
    <use xlinkHref={`/unee-t_logo${isDarkType ? '' : '_reverse'}.svg#icon`} />
  </SvgIcon>
)

UneeTIcon.propTypes = {
  isDarkType: PropTypes.bool
}

const LogoTextStyle = {
  width: 106,
  height: 27
}
export const UneeTLogoText = ({ sizeMultiplier, textColor, ...moreProps }) => {
  const mult = sizeMultiplier || 1
  const { width, height } = LogoTextStyle
  return (
    <SvgIcon viewBox='0 0 106 27' {...moreProps}
      style={{ color: textColor || '#FFFFFF', width: width * mult, height: height * mult }}>
      <use xlinkHref='/unee-t_wordmark.svg#logo-text' />
    </SvgIcon>
  )
}
UneeTLogoText.propTypes = {
  textColor: PropTypes.string,
  sizeMultiplier: PropTypes.number
}
