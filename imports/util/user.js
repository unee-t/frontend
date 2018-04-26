import React from 'react'

import themes from '../ui/components/user-themes.mss'
import UserAvatar from '../ui/components/user-avatar'

export const rolesColorDict = {
  'Administrator': 'theme1',
  'The Tenant': 'theme2',
  'Owner/Landlord': 'theme3',
  'Contractor': 'theme4',
  'Management Company': 'theme5',
  'Agent': 'theme6',
  'default': 'theme1'
}

export const getColorForUser = (user) => (
  themes[ rolesColorDict[ user.role && user.role.trim() ] || rolesColorDict[ 'default' ] ]
)

export const userInfoItem = (user, rightRenderer) => {
  const colorForUser = getColorForUser(user)

  return (
    <div key={user.login} className={colorForUser + ' flex pt2'}>
      <UserAvatar user={user} />
      <div className='ml2 pl1 flex-grow overflow-hidden'>
        <div className='mid-gray ellipsis'>{user.name || user.login}</div>
        <div className='mt1 f7 gray ellipsis'>{user.role || 'Administrator'}</div>
      </div>
      {rightRenderer && rightRenderer(user)}
    </div>
  )
}
