import React from 'react'
import PropTypes from 'prop-types'

import styles from './user-themes.mss'

const UserAvatar = ({user, isSmall}) => {
  const userDisplayText = user.name || user.login || user.email
  return (
    <div className={
      [styles.userAvatar, styles.sized, (isSmall ? styles.sizeSmall : ''), 'dib v-btm br-100 tc white'].join(' ')
    }>
      {userDisplayText.slice(0, 1).toUpperCase()}
    </div>
  )
}

UserAvatar.propTypes = {
  user: PropTypes.object.isRequired,
  isSmall: PropTypes.bool
}

export default UserAvatar
