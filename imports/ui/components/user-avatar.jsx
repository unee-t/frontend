import React from 'react'
import PropTypes from 'prop-types'

import styles from './user-themes.mss'

const UserAvatar = ({creator, isSmall, additionalClasses}) => {
  const userDisplayText = user.name || user.login || user.email
  const classes = [
    styles.userAvatar,
    'dib ml2 v-btm br-100 tc white'
  ]
  if (isSmall) classes.push(styles.sizeSmall)
  if (additionalClasses) classes.push(additionalClasses)
  return (
    <div className={classes.join(' ')}>
      {userDisplayText.slice(0, 1).toUpperCase()}
    </div>
  )
}

UserAvatar.propTypes = {
  user: PropTypes.object.isRequired,
  isSmall: PropTypes.bool,
  additionalClasses: PropTypes.string
}

export default UserAvatar
