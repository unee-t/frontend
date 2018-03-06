import React, { Component } from 'react'
import PropTypes from 'prop-types'
import MenuItem from 'material-ui/MenuItem'
import UserAvatar from './user-avatar'
import themes from './user-themes.mss'

class UsersSearchList extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      filterString: ''
    }
  }
  render () {
    const { users, onUserClick, userStatusRenderer, searchInputRef, userClassNames } = this.props
    const { filterString } = this.state
    const matcher = filterString ? new RegExp(filterString, 'i') : null
    const filteredUsers = users
      .map((u, idx) => Object.assign(u, { origIdx: idx }))
      .filter(user => !matcher || (user.name && user.name.match(matcher)) || user.login.match(matcher))
    // TODO: to be used to resolve #80
    /* .sort((a, b) => {
     if (a.alreadyInvited && !b.alreadyInvited) {
     return 1
     } else if (b.alreadyInvited && !a.alreadyInvited) {
     return -1
     } else {
     return 0
     }
     }) */
    return (
      <div className='flex-grow flex flex-column'>
        <div className='no-shrink flex'>
          <input placeholder='Enter the name or email'
            className='input-reset ba b--moon-gray outline-0 lh-dbl mb2 ti3 flex-grow'
            value={filterString} onChange={evt => this.setState({filterString: evt.target.value})}
            ref={searchInputRef}
          />
        </div>
        <div className='ba b--moon-gray flex-grow h5 overflow-auto'>
          <div className='pb2'>
            {filteredUsers.length ? (
              <ul className='list mv0 pa0 pt1 min-h-3'>
                {filteredUsers.map((user, idx) => {
                  const userStatusComp = userStatusRenderer && userStatusRenderer(user)
                  const extraClasses = userClassNames ? userClassNames(user) : ''
                  return (
                    <MenuItem key={idx} onClick={() => onUserClick(user)} innerDivStyle={{padding: 0}}>
                      <div className={
                        themes['theme' + ((user.origIdx % 10) + 1)] + ' flex pv2 ph2 lh-title ' + extraClasses
                      }>
                        <div className='ml1'>
                          <UserAvatar user={user} />
                        </div>
                        <div className='ml2 flex-grow overflow-hidden'>
                          <div className={'f5 ellipsis ' + (user.pending ? 'i silver' : 'bondi-blue')}>
                            {user.name || user.login}
                          </div>
                          <div className='f7 gray ellipsis'>{user.role}</div>
                        </div>
                        {userStatusComp && (
                          <div className='ml2'>
                            {userStatusComp}
                          </div>
                        )}
                      </div>
                    </MenuItem>
                  )
                })}
              </ul>
            ) : (
              <p className='tc i warn-crimson'>We couldn't find any users with the name entered.</p>
            )}
          </div>
        </div>
      </div>
    )
  }
}

UsersSearchList.propTypes = {
  users: PropTypes.array.isRequired,
  onUserClick: PropTypes.func.isRequired,
  userStatusRenderer: PropTypes.func,
  userClassNames: PropTypes.func,
  searchInputRef: PropTypes.func
}

export default UsersSearchList
