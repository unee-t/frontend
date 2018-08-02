import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Meteor } from 'meteor/meteor'
import { createContainer } from 'meteor/react-meteor-data'
import { push } from 'react-router-redux'
import { Route, Link } from 'react-router-dom'
import { Tabs, Tab } from 'material-ui/Tabs'
import SwipeableViews from 'react-swipeable-views'
import MenuItem from 'material-ui/MenuItem'
import FontIcon from 'material-ui/FontIcon'
import { CSSTransition } from 'react-transition-group'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import Units, { collectionName as unitsCollName, getUnitRoles } from '../../api/units'
import Cases, { isClosed, collectionName as casesCollName } from '../../api/cases'
import UnitMetaData from '../../api/unit-meta-data'
import { placeholderEmailMatcher } from '../../util/matchers'
import InnerAppBar from '../components/inner-app-bar'
// import CreateReportDialog from '../dialogs/create-report-dialog'
import { makeMatchingUser } from '../../api/custom-users'
import Preloader from '../preloader/preloader'
import { infoItemMembers } from '../util/static-info-rendering'
import { userInfoItem } from '../../util/user'
import { storeBreadcrumb } from '../general-actions'

const viewsOrder = ['cases', 'reports', 'overview']

const severityIcons = {
  'DEAL BREAKER!': {
    icon: 'format_align_justify',
    color: 'var(--warn-crimson)'
  },
  'critical': {
    icon: 'reorder',
    color: '#F00000'
  },
  'major': {
    icon: 'dehaze',
    color: '#FF6701'
  },
  'normal': {
    icon: 'drag_handle',
    color: '#4A90E2'
  },
  'minor': {
    icon: 'remove',
    color: '#99CC33'
  }
}

const caseMenuItemDivStyle = {
  display: 'flex',
  alignItems: 'center'
}

class Unit extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      showOpenCases: true,
      sortedCases: [],
      assignedToMe: false
    }
  }

  get filteredCases () {
    const { showOpenCases, sortedCases, assignedToMe } = this.state
    const openFilter = showOpenCases ? x => !isClosed(x) : x => isClosed(x)
    const assignedFilter = assignedToMe ? x => x.assignee === this.props.currentUser.bugzillaCreds.login : x => true
    const filteredCases = sortedCases.filter(caseItem => openFilter(caseItem) && assignedFilter(caseItem))
    return filteredCases
  }

  handleStatusClicked (value) {
    this.setState({ showOpenCases: value })
  }

  handleAssignedClicked () {
    this.setState({ assignedToMe: !this.state.assignedToMe })
  }

  handleChange = val => {
    const { match, dispatch } = this.props
    dispatch(push(`${match.url}/${viewsOrder[val]}`))
  }

  componentWillReceiveProps (nextProps) {
    const { caseList } = this.props
    if ((!caseList && nextProps.caseList) || (caseList && caseList.length !== nextProps.caseList.length)) {
      const severityList = Object.keys(severityIcons)
      this.setState({
        sortedCases: nextProps.caseList.slice().sort((a, b) =>
          severityList.indexOf(a.severity) - severityList.indexOf(b.severity)
        )
      })
    }
  }

  render () {
    const { unitItem, isLoading, unitError, casesError, unitUsers, dispatch, match } = this.props
    const { sortedCases, showOpenCases, assignedToMe } = this.state
    const { filteredCases } = this
    const rootMatch = match
    const { unitId } = match.params

    if (isLoading) return <Preloader />
    if (unitError) return <h1>An error occurred: {unitError.error}</h1>
    if (casesError) return <h1>An error occurred: {casesError.error}</h1>
    const fabDescriptors = [
      {
        color: 'var(--bondi-blue)',
        href: `/case/new?unit=${unitId}`,
        icon: 'add'
      }
      // {
      //   color: 'var(--bondi-blue)',
      //   href: `${rootMatch.url}/${viewsOrder[1]}/new`,
      //   icon: 'add'
      // }
    ]

    const unitName = unitItem.metaData.displayName || unitItem.name

    return (
      <div className='full-height flex flex-column'>
        <InnerAppBar
          shadowless
          title={unitName}
          onBack={() => dispatch(push(match.url.split('/').slice(0, -1).join('/')))}
        />
        <Route path={`${rootMatch.url}/:viewName`} children={({ match }) => {
          const viewIdx = match ? viewsOrder.indexOf(match.params.viewName) : 0
          return (
            <div className='flex-grow flex flex-column overflow-hidden'>
              <Tabs
                className='no-shrink'
                onChange={this.handleChange}
                value={viewIdx}
                inkBarStyle={{backgroundColor: 'white'}}
              >
                <Tab label={`CASES (${sortedCases.length})`} value={0} />
                <Tab label='REPORTS' value={1} />
                <Tab label='OVERVIEW' value={2} />
              </Tabs>
              <div className='flex-grow flex flex-column overflow-auto'>
                <SwipeableViews
                  resistance
                  style={{flex: 1, display: 'flex', flexDirection: 'column'}}
                  containerStyle={{flex: 1}}
                  slideStyle={{display: 'flex', flexDirection: 'column'}}
                  index={viewIdx}
                  onChangeIndex={this.handleChange}
                >

                  <div className='flex-grow bg-very-light-gray'>
                    <div className='flex pl3 pv3 bb b--very-light-gray bg-white'>
                      <div
                        className={'f6 fw5 ph2 ' + (showOpenCases ? 'mid-gray' : 'silver')}
                        onClick={() => this.handleStatusClicked(true)}
                      >
                        Open
                      </div>
                      <div
                        className={'f6 fw5 ml4 ph2 ' + (!showOpenCases ? 'mid-gray' : 'silver')}
                        onClick={() => this.handleStatusClicked(false)}
                      >
                        Closed
                      </div>
                      <div
                        onClick={() => this.handleAssignedClicked()}
                        className={'f6 fw5 ml4 ph2 ' + (assignedToMe ? 'mid-gray' : 'silver')}
                      >
                        Assigned To Me
                      </div>
                    </div>
                    {filteredCases.map(({id, title, severity}) => (
                      <div key={id} className='bb b--very-light-gray bg-white'>
                        <Link
                          to={`/case/${id}`}
                          className='link'
                          onClick={() => dispatch(storeBreadcrumb(rootMatch.url))}
                        >
                          <MenuItem innerDivStyle={caseMenuItemDivStyle}>
                            <FontIcon className='material-icons mr2' color={severityIcons[severity].color}>
                              {severityIcons[severity].icon}
                            </FontIcon>
                            <span className='bondi-blue pl1 ellipsis'>{title}</span>
                          </MenuItem>
                        </Link>
                      </div>
                    ))}
                  </div>
                  <div className='flex-grow bg-very-light-gray'>
                    <div className='mt5 pt3 tc'>
                      <div className='dib relative'>
                        <FontIcon className='material-icons' color='var(--moon-gray)' style={{fontSize: '5rem'}}>
                          content_paste
                        </FontIcon>
                        <div className='absolute bottom-0 right-0 pb1'>
                          <div className='br-100 ba b--very-light-gray bg-very-light-gray lh-cram'>
                            <FontIcon className='material-icons' color='var(--moon-gray)' style={{fontSize: '2.5rem'}}>
                              add_circle_outline
                            </FontIcon>
                          </div>
                        </div>
                      </div>
                      <div className='mid-gray b lh-copy'>
                        You have no inspection reports yet
                      </div>
                    </div>
                    {/* <Route exact path={`${rootMatch.url}/${viewsOrder[1]}/new`} children={({ match }) => (
                      <CreateReportDialog
                        show={!!match}
                        onDismissed={() => dispatch(goBack())}
                        unitName={unitItem.name}
                      />
                    )} /> */}
                  </div>
                  <div className='flex-grow bg-very-light-gray'>
                    <div className='bg-white card-shadow-1 pa3'>
                      <div>
                        {infoItemMembers('Unit name', unitName)}
                      </div>
                      <div className='mt3'>
                        {infoItemMembers('Unit group', unitItem.classification)}
                      </div>
                      <div className='mt3'>
                        {infoItemMembers('Unit type', unitItem.metaData.unitType)}
                      </div>
                      <div className='mt3'>
                        {infoItemMembers('Additional description', unitItem.metaData.moreInfo || unitItem.description)}
                      </div>
                    </div>
                    <div className='mt2 bg-white card-shadow-1 pa3'>
                      <div className='fw5 silver lh-title'>
                        ADDRESS
                      </div>
                      <div className='mt1'>
                        {infoItemMembers('Address', unitItem.metaData.streetAddress)}
                      </div>
                      <div className='mt3'>
                        {infoItemMembers('City', unitItem.metaData.city)}
                      </div>
                      <div className='mt3'>
                        {infoItemMembers('Country', unitItem.metaData.country)}
                      </div>
                      <div className='mt3 flex'>
                        <div className='flex-grow'>
                          {infoItemMembers('State', unitItem.metaData.state)}
                        </div>
                        <div className='flex-grow'>
                          {infoItemMembers('Zip / Postal code', unitItem.metaData.zipCode)}
                        </div>
                      </div>
                    </div>
                    <div className='mt2 bg-white card-shadow-1 pa3'>
                      <div className='fw5 silver lh-title'>
                        PEOPLE
                      </div>
                      {unitUsers
                        .filter(user => (
                          !placeholderEmailMatcher(user.login)
                        ))
                        .map(user => (
                          <div className='mt1' key={user.login}>{userInfoItem(user)}</div>
                        ))
                      }
                    </div>
                  </div>
                </SwipeableViews>
              </div>

              {fabDescriptors.map((desc, ind) => (
                <div key={ind} className='absolute bottom-1 right-1'>
                  <CSSTransition in={viewIdx === ind} timeout={500} classNames='zoom-effect' unmountOnExit>
                    <FloatingActionButton
                      backgroundColor={desc.color}
                      className='zoom-effect'
                      onClick={() => dispatch(push(desc.href))}
                    >
                      <FontIcon className='material-icons'>{desc.icon}</FontIcon>
                    </FloatingActionButton>
                  </CSSTransition>
                </div>
              ))}
            </div>
          )
        }} />
      </div>
    )
  }
}
Unit.propTypes = {
  unitItem: PropTypes.object,
  unitError: PropTypes.object,
  casesError: PropTypes.object,
  isLoading: PropTypes.bool,
  unitUsers: PropTypes.array,
  caseList: PropTypes.array
}

let unitError, casesError
export default connect(
  () => ({})
)(createContainer((props) => {
  const { unitId } = props.match.params
  const unitHandle = Meteor.subscribe(`${unitsCollName}.byIdWithUsers`, unitId, {
    onStop: error => {
      unitError = error
    }
  })
  const unitItem = unitHandle.ready() ? Units.findOne({id: parseInt(unitId)}) : null
  let casesHandle
  if (unitItem) {
    Object.assign(unitItem, {
      metaData: UnitMetaData.findOne({bzId: unitItem.id}) || {}
    })
    casesHandle = Meteor.subscribe(`${casesCollName}.byUnitName`, unitItem.name, {
      onStop: error => {
        casesError = error
      }
    })
  }
  return {
    isLoading: !unitHandle.ready() || !casesHandle.ready(),
    unitUsers: unitItem ? getUnitRoles(unitItem).map(makeMatchingUser) : null,
    caseList: unitItem ? Cases.find({selectedUnit: unitItem.name}).fetch() : null,
    currentUser: Meteor.subscribe('users.myBzLogin').ready() ? Meteor.user() : null,
    casesError,
    unitError,
    unitItem
  }
}, Unit))
