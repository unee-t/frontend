import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { createContainer } from 'meteor/react-meteor-data'
import { Link } from 'react-router-dom'
import Drawer from 'material-ui/Drawer'
import { logoutUser, setDrawerState } from '../general-actions'
import MenuItem from 'material-ui/MenuItem'
import FontIcon from 'material-ui/FontIcon'
import { renderAppBarLeft, renderCurrUserAvatar } from '../util/app-bar-utils'

const linkDrawerItem = ({href, iconName, text}) => (
  <Link className='link' to={href} target='_blank'>
    <MenuItem>
      <div className='flex items-center pv2 mv1'>
        <div className='w1-5 lh-title tc'>
          <FontIcon className='material-icons' color='var(--mid-gray)'>{iconName}</FontIcon>
        </div>
        <div className='ml4 mid-gray'>{text}</div>
      </div>
    </MenuItem>
  </Link>
)

class SideMenu extends Component {
  render () {
    const { user, isDrawerOpen, dispatch } = this.props
    return user ? (
      <Drawer
        docked={false}
        width={300}
        open={isDrawerOpen}
        onRequestChange={(open) => dispatch(setDrawerState(open))}
      >
        <div className='bg-bondi-blue pa3'>
          {renderAppBarLeft(() => dispatch(setDrawerState(true)))}
          <div className='flex items-center mt4'>
            {renderCurrUserAvatar(user, true)}
            <div className='ml3 white ellipsis'>
              {user.profile && (user.profile.name || user.emails[0].address)}
            </div>
          </div>
        </div>
        {linkDrawerItem({
          href: 'https://unee-t.com/contact-support/',
          iconName: 'live_help',
          text: 'Support'
        })}
        {linkDrawerItem({
          href: 'https://forum.unee-t.com/',
          iconName: 'forum',
          text: 'Forum'
        })}
        {linkDrawerItem({
          href: 'https://documentation.unee-t.com',
          iconName: 'help',
          text: 'FAQ'
        })}
        <MenuItem onClick={() => dispatch(logoutUser())}>
          <div className='flex items-center pv2 mv1'>
            <div className='w1-5 lh-title tc'>
              <FontIcon className='icon-logout' color='var(--mid-gray)' />
            </div>
            <div className='ml4 mid-gray'>Logout</div>
          </div>
        </MenuItem>
      </Drawer>
    ) : null
  }
}

SideMenu.propTypes = {
  user: PropTypes.object,
  isDrawerOpen: PropTypes.bool
}

export default connect(
  ({ drawerState }) => ({isDrawerOpen: drawerState.isOpen}) // map redux state to props
)(createContainer(() => ({ // map meteor state to props
  user: Meteor.user()
}), SideMenu))
