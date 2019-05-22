import React, { Component } from 'react'
import PropTypes from 'prop-types'
import UserSelectionBox from './user-selection-box'

class UsersSearchList extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      filterString: ''
    }
  }
  render () {
    const {
      users, onUserClick, userStatusRenderer, userClassNames, emptyListMessage
    } = this.props
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

    // TODO: Restore for user search functionality (needs layout height fixes for FF RE: #769)
    // return (
    //   <div className='flex-grow flex flex-column'>
    //     <div className='no-shrink flex'>
    //       <input placeholder='Enter the name or email'
    //         className={'input-reset ba b--moon-gray outline-0 lh-dbl mb2 ti3 flex-grow' + (searchEnabled ? '' : ' dn')}
    //         value={filterString} onChange={evt => this.setState({ filterString: evt.target.value })}
    //         ref={searchInputRef}
    //       />
    //     </div>
    //     <UserSelectionBox
    //       {...{ userStatusRenderer, userClassNames, onUserClick, emptyListMessage }}
    //       usersList={filteredUsers}
    //     />
    //   </div>
    // )

    return (
      <UserSelectionBox
        {...{ userStatusRenderer, userClassNames, onUserClick, emptyListMessage }}
        usersList={filteredUsers}
      />
    )
  }
}

UsersSearchList.propTypes = {
  users: PropTypes.array.isRequired,
  onUserClick: PropTypes.func.isRequired,
  userStatusRenderer: PropTypes.func,
  userClassNames: PropTypes.func,
  searchInputRef: PropTypes.func,
  searchEnabled: PropTypes.bool,
  emptyListMessage: PropTypes.string
}

export default UsersSearchList
