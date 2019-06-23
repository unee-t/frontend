import React from 'react'
import PropTypes from 'prop-types'
import UserMenuItem from './user-menu-item'

const UserSelectionBox = ({ usersList, userStatusRenderer, userClassNames, onUserClick, emptyListMessage }) => (
  <div className='ba b--moon-gray flex-grow h5 overflow-auto'>
    <div className='pb2'>
      {usersList.length ? (
        <ul className='list mv0 pa0 pt1 min-h-3'>
          {usersList.map((user, idx) => {
            const statusComponent = userStatusRenderer && userStatusRenderer(user)
            const extraClasses = userClassNames ? userClassNames(user) : ''
            return (
              <UserMenuItem key={idx}
                onClick={() => onUserClick(user)}
                innerDivExtraClasses={extraClasses}
                {...{ user, statusComponent }}
              />
            )
          })}
        </ul>
      ) : (
        <p className='tc i warn-crimson'>
          {emptyListMessage || 'We couldn\'t find any users with the name entered.'}
        </p>
      )}
    </div>
  </div>
)

UserSelectionBox.propTypes = {
  usersList: PropTypes.array.isRequired,
  userStatusRenderer: PropTypes.func,
  userClassNames: PropTypes.func,
  onUserClick: PropTypes.func.isRequired,
  emptyListMessage: PropTypes.string
}

export default UserSelectionBox
