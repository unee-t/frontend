import React from 'react'
import IconButton from 'material-ui/IconButton'
import UserAvatar from '../components/user-avatar'
import { getColorForUser } from '/imports/util/user.js'
import { UneeTIcon, UneeTLogoText } from '../components/unee-t-icons'

import {
  logoIconStyle,
  logoButtonStyle
} from '../components/app-bar.mui-styles'

export const renderAppBarLeft = (onClick) => (
  <div className='flex items-center pl2'>
    <UneeTLogoText />
    <IconButton iconStyle={logoIconStyle} style={logoButtonStyle} onClick={onClick}>
      <UneeTIcon />
    </IconButton>
  </div>
)

export const renderCurrUserAvatar = (user, isBig) => {
  const userColor = getColorForUser(user)

  return (
    <UserAvatar additionalClasses={`ba ${userColor}`} isBig={isBig} user={{
      name: user.profile && user.profile.name,
      login: user.bugzillaCreds && user.bugzillaCreds.login,
      email: user.emails && user.emails[0].address
    }} />
  )
}
