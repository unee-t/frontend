import React from 'react'
import PropTypes from 'prop-types'

import styles from './user-themes.mss'

const UserAvatar = ({creator, isSmall}) => (
  <div className={styles.userAvatar + (isSmall ? ` ${styles.sizeSmall}` : '') + ' dib ml2 v-btm br-100 tc white'}>
    {creator.slice(0, 1).toUpperCase()}
  </div>
)

UserAvatar.propTypes = {
  creator: PropTypes.string.isRequired,
  isSmall: PropTypes.bool
}

export default UserAvatar
