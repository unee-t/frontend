// @flow
import * as React from 'react'
import UserMenuItem from './user-menu-item'
import type { UserDetails } from './user-menu-item'

type Props = {
  currentAssignee: UserDetails,
  defaultAssignees: Array<UserDetails>,
  otherUsers: Array<UserDetails>,
  onUserClicked: (user: UserDetails) => void,
  currentSelectedUser: ?UserDetails
}

export default class AssigneeSelectionList extends React.Component<Props> {
  renderUserItem = (user: UserDetails, key?: number | string) => {
    const { currentAssignee, onUserClicked, currentSelectedUser } = this.props
    return (
      <UserMenuItem
        key={key}
        onClick={() => onUserClicked(user)}
        statusComponent={currentAssignee === user ? (<span className='f7 gray b'>Assigned</span>) : null}
        innerDivExtraClasses={currentSelectedUser && user.login === currentSelectedUser.login ? 'bg-very-light-gray' : ''}
        user={user}
      />
    )
  }
  render () {
    const { currentAssignee, defaultAssignees, otherUsers } = this.props
    return (
      <div className='ba b--moon-gray flex-grow h5 overflow-auto'>
        <div className='pa1'>
          <div>
            {this.renderUserItem(currentAssignee)}
          </div>
          {defaultAssignees.length || otherUsers.length ? (
            <div>
              {defaultAssignees.length > 0 && (
                <div className='bt b--moon-gray'>
                  <div className='f7 gray b pt2 pl2'>
                    Default assignees
                  </div>
                  <ul className='list mv0 pa0 pt1'>
                    {defaultAssignees.map(this.renderUserItem)}
                  </ul>
                </div>
              )}
              {otherUsers.length > 0 && (
                <div className='bt b--moon-gray'>
                  <div className='f7 gray b pt2 pl2'>
                    Other people associated with this unit
                  </div>
                  <ul className='list mv0 pa0 pt1'>
                    {otherUsers.map(this.renderUserItem)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className='bt b--moon-gray'>
              <p className='tc f6 i warn-crimson'>
                We couldn't find any other existing users to assign
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }
}
