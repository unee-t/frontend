import React from 'react'
import SvgIcon from 'material-ui/SvgIcon'

export const UneeTIcon = props => (
  <SvgIcon {...props} viewBox='3 3 39 39'>
    <use xlinkHref='/unee-t_logo_reverse.svg#icon' />
  </SvgIcon>
)

const UneeTLogoTextStyle = {
  width: 106,
  height: 27
}
export const UneeTLogoText = props => (
  <SvgIcon viewBox='0 0 106 27' style={UneeTLogoTextStyle} {...props}>
    <use xlinkHref='/unee-t_wordmark.svg#logo-text' />
  </SvgIcon>
)
