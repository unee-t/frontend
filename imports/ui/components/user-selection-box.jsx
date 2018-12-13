import React from 'react'
import PropTypes from 'prop-types'
import MenuItem from 'material-ui/MenuItem'
import UserAvatar from './user-avatar'

import { resetMenuItemDivStyle } from '../general.mui-styles'
import { getColorForUser } from '/imports/util/user'

const UserSelectionBox = ({ usersList, userStatusRenderer, userClassNames, onUserClick, emptyListMessage }) => (
  <div className='ba b--moon-gray flex-grow h5 overflow-auto'>
    <div className='pb2'>
      {usersList.length ? (
        <ul className='list mv0 pa0 pt1 min-h-3'>
          {usersList.map((user, idx) => {
            const userStatusComp = userStatusRenderer && userStatusRenderer(user)
            const extraClasses = userClassNames ? userClassNames(user) : ''
            const emailId = user.login.split('@')[0]
            return (
              <MenuItem key={idx} onClick={() => onUserClick(user)} innerDivStyle={resetMenuItemDivStyle}>
                <div className={
                  getColorForUser(user) + ' flex pv2 ph2 lh-title ' + extraClasses
                }>
                  <div className='ml1'>
                    <UserAvatar user={user} imageUrl={user.avatarUrl} />
                  </div>
                  <div className='ml2 flex-grow overflow-hidden'>
                    <div className={'f5 ellipsis ' + (user.pending ? 'i silver' : 'bondi-blue')}>
                      { user.name || emailId }
                    </div>
                    <div className='f7 gray ellipsis'>{user.role}</div>
                  </div>
                  {userStatusComp && (
                    <div className='ml2 flex flex-column justify-center'>
                      {userStatusComp}
                    </div>
                  )}
                </div>
              </MenuItem>
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
