import React from 'react'
import PropTypes from 'prop-types'

import styles from './user-themes.mss'

const UserAvatar = ({user, isSmall, isBig, additionalClasses}) => {
  const userDisplayText = user.name || user.login || user.email || ''
  const classes = [
    styles.userAvatar,
    styles.sized,
    'dib v-btm br-100 tc white'
  ]
  if (isSmall) classes.push(styles.size2)
  else if (isBig) classes.push(styles.size3, 'f3')
  else classes.push(styles.size1)

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
  isBig: PropTypes.bool,
  additionalClasses: PropTypes.string
}

export default UserAvatar
