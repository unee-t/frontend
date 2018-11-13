import React, { Component } from 'react'
import { Route, Switch, matchPath } from 'react-router-dom'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Meteor } from 'meteor/meteor'
import { createContainer } from 'meteor/react-meteor-data'
import _ from 'lodash'
import AppBar from 'material-ui/AppBar'
import IconButton from 'material-ui/IconButton'
import FontIcon from 'material-ui/FontIcon'
import { UneeTIcon } from '../components/unee-t-icons'
import { setDrawerState } from '../general-actions'
import CaseExplorer from '../case-explorer/case-explorer'
import Preloader from '../preloader/preloader'
import Case from './case'
import { renderCurrUserAvatar, renderAppBarLeft } from '../util/app-bar-utils'

import {
  titleStyle
} from '../components/app-bar.mui-styles'

import {
  emptyPaneIconStyle
} from './case-master.mui-styles'

const isMobileScreen = window.matchMedia('screen and (max-width: 768px)').matches

class CaseMaster extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      componentsProps: {},
      isLoading: true,
      isSubLoading: false
    }
    this.routes = [
      {
        path: '/case',
        RouteComp: CaseExplorer,
        exact: true
      },
      {
        path: '/case/:caseId',
        RouteComp: Case
      }
    ]
  }
  getMatchingPath (props) {
    // Finding the matching path out of the list of routes, using "matchPath" which has the same matching logic as Route
    const routeMatches = this.routes.reduce((matching, route) => {
      const match = matchPath(props.location.pathname, route)
      if (match) {
        matching.push(match)
      }
      return matching
    }, [])

    // It should match at least 1, but could be more (Switch takes the first), checking 'length' in case of bad config
    return routeMatches.length && routeMatches[0]
  }
  componentWillMount () {
    // Keeping the initial match
    this.matchingPath = this.getMatchingPath(this.props)
  }
  componentWillReceiveProps (nextProps) {
    // Comparing with the next match to see if the route component is switched and will begin loading data
    const nextMatch = this.getMatchingPath(nextProps)

    if (this.matchingPath.path !== nextMatch.path || !_.isEqual(this.matchingPath.params, nextMatch.params)) {
      this.matchingPath = nextMatch
      if (isMobileScreen) {
        this.setState({
          isLoading: true
        })
      } else {
        this.setState({
          isSubLoading: true
        })
      }
    }
  }
  handleIconClick = () => {
    this.props.dispatch(setDrawerState(true))
  }
  render () {
    const { isLoading, componentsProps } = this.state
    const { user } = this.props
    return (
      <div className='flex flex-column full-height roboto overflow-hidden'>
        {isLoading ? (
          <Preloader />
        ) : isMobileScreen ? (
          <Switch>
            {this.routes.map(({ path, RouteComp, exact = false }) => (
              <Route key={path} exact={exact} path={path} render={() => (
                <RouteComp.MobileHeader contentProps={componentsProps[path]} onIconClick={this.handleIconClick} />
              )} />
            ))}
          </Switch>
        ) : (
          <AppBar titleStyle={titleStyle}
            iconElementLeft={renderAppBarLeft(this.handleIconClick)}
            iconElementRight={
              <div className='flex items-center'>
                <IconButton>
                  <FontIcon className='material-icons' color='white'>search</FontIcon>
                </IconButton>
                <IconButton>
                  <FontIcon className='material-icons' color='white'>notifications</FontIcon>
                </IconButton>
                <div className='white'>Welcome, {user.profile && user.profile.name}</div>
                <div className='ml2'>
                  {renderCurrUserAvatar(user)}
                </div>
              </div>
            }
          />
        )}
        {isMobileScreen ? (
          <Switch>
            {this.routes.map(({ path, RouteComp, exact }) => (
              <Route key={path} exact={exact} path={path} render={() => {
                return (
                  <RouteComp className={isLoading ? 'dn' : ''} dispatchLoadingResult={data => {
                    this.setState({
                      componentsData: Object.assign(componentsProps, { [path]: data }),
                      isLoading: false
                    })
                  }} />
                )
              }} />
            ))}
          </Switch>
        ) : (
          <div className={isLoading ? 'dn' : 'flex flex-grow overflow-hidden'}>
            <div className='flex-3'>
              <CaseExplorer dispatchLoadingResult={() => {
                this.setState({
                  isLoading: false
                })
              }} />
            </div>
            <div className='flex-10 flex items-center justify-center bg-very-light-gray h-100'>
              <Route path='/case/:caseId' children={({ match }) => {
                if (match) {
                  const { isSubLoading } = this.state
                  return (
                    <div className='h-100 w-100'>
                      {isSubLoading && (
                        <Preloader />
                      )}
                      <Case className={isSubLoading ? 'dn' : ''} dispatchLoadingResult={() => {
                        this.setState({
                          isSubLoading: false
                        })
                      }} />
                    </div>
                  )
                } else {
                  return (
                    <div className='flex flex-column items-center'>
                      <UneeTIcon style={emptyPaneIconStyle} />
                      <div className='mt4 roboto f4 mid-gray'>Select a case on the left to begin</div>
                    </div>
                  )
                }
              }} />
            </div>
          </div>
        )}
      </div>
    )
  }
}

CaseMaster.propTypes = {
  user: PropTypes.object.isRequired
}

export default connect(() => ({}))(createContainer(() => ({
  user: Meteor.user() || {}
}), CaseMaster))
