// @flow
import * as React from 'react'
import { resetMenuItemDivStyle } from '../general.mui-styles'
import { getColorForUser } from '../../util/user'
import UserAvatar from './user-avatar'
import MenuItem from 'material-ui/MenuItem'

export type UserDetails = {
  avatarUrl?: string,
  pending?: boolean,
  role: string,
  name?: string,
  login?: string,
  email?: string
}

type Props = {
  onClick: () => any,
  innerDivExtraClasses?: string,
  statusComponent?: React.Node,
  user: UserDetails
}

export default class UserMenuItem extends React.Component<Props> {
  render () {
    const { onClick, innerDivExtraClasses, user, statusComponent } = this.props

    return (
      <MenuItem {...{ onClick }} innerDivStyle={resetMenuItemDivStyle}>
        <div className={
          getColorForUser(user) + ' flex pv2 ph2 lh-title ' + (innerDivExtraClasses || '')
        }>
          <div className='ml1'>
            <UserAvatar user={user} imageUrl={user.avatarUrl} />
          </div>
          <div className='ml2 flex-grow overflow-hidden'>
            <div className={'f5 ellipsis ' + (user.pending ? 'i silver' : 'bondi-blue')}>
              { user.name || (user.login && user.login.split('@')[0]) }
            </div>
            <div className='f7 gray ellipsis'>{user.role}</div>
          </div>
          {statusComponent && (
            <div className='ml2 flex flex-column justify-center'>
              {statusComponent}
            </div>
          )}
        </div>
      </MenuItem>
    )
  }
}
