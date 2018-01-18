import React, { Component } from 'react'
import { Route, Switch, matchPath } from 'react-router-dom'
import CaseExplorer from '../case-explorer/case-explorer'
import Preloader from '../preloader/preloader'
import Case from './case'

class CaseMaster extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      componentsProps: {},
      isLoading: true
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
    const routeMatches = this.routes.filter(match => matchPath(props.location.pathname, match))

    // It should match at least 1, but could be more (Switch takes the first), checking 'length' in case of bad config
    return routeMatches.length && routeMatches[0].path
  }
  componentWillMount () {
    // Keeping the initial match
    this.matchingPath = this.getMatchingPath(this.props)
  }
  componentWillReceiveProps (nextProps) {
    // Comparing with the next match to see if the route component is switched and will begin loading data
    const nextMatch = this.getMatchingPath(nextProps)
    if (this.matchingPath !== nextMatch) {
      this.matchingPath = nextMatch
      this.setState({
        isLoading: true
      })
    }
  }
  render () {
    const { isLoading, componentsProps } = this.state
    return (
      <div className='flex flex-column full-height roboto overflow-hidden'>
        {isLoading ? (
          <Preloader />
        ) : (
          <Switch>
            {this.routes.map(({path, RouteComp, exact = false}) => (
              <Route key={path} exact={exact} path={path} render={() => (
                <RouteComp.MobileHeader contentProps={componentsProps[path]} />
              )} />
            ))}
          </Switch>
        )}
        <Switch>
          {this.routes.map(({path, RouteComp, exact}) => (
            <Route key={path} exact={exact} path={path} render={() => {
              return (
                <RouteComp className={isLoading ? 'dn' : ''} dispatchLoadingResult={data => {
                  this.setState({
                    componentsData: Object.assign(componentsProps, {[path]: data}),
                    isLoading: false
                  })
                }} />
              )
            }} />
          ))}
        </Switch>
      </div>
    )
  }
}

export default CaseMaster
