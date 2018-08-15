import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import RootAppBar from '../components/root-app-bar'
import { push } from 'react-router-redux'
import FontIcon from 'material-ui/FontIcon'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import Reports from '../../api/reports'
import UnitMetaData from '../../api/unit-meta-data'
import Preloader from '../preloader/preloader'
import { setDrawerState } from '../general-actions'
import {
  unitIconsStyle
} from '../case-explorer/case-explorer.mui-styles'

function NoItem (props) {
  return (
    <div className='flex-grow flex flex-column items-center justify-center'>
      <div className='tc'>
        <div className='dib relative'>
          <FontIcon className='material-icons' color='var(--moon-gray)' style={{fontSize: '6rem'}}>
            card_travel
          </FontIcon>
          <div className='absolute bottom--1 right--1 pb2'>
            <div className='br-100 pa1 bg-very-light-gray lh-cram'>
              <FontIcon className='material-icons' color='var(--moon-gray)' style={{fontSize: '2.5rem'}}>
                add_circle
              </FontIcon>
            </div>
          </div>
        </div>
        <div className='mt3 ph4'>
          <div className='mid-gray b lh-copy'>
            <div>There are no {props.item}s that match your current filter combination.</div>
            <div>Click on the "+" button to select a unit to add a new {props.item}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

class ReportExplorer extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      showOpen: true,
      assignedToMe: false
    }
  }

  handleStatusClicked (value) {
    this.setState({ showOpen: value })
  }

  handleAssignedClicked () {
    this.setState({ assignedToMe: !this.state.assignedToMe })
  }

  render () {
    const { isLoading, dispatch, reportList } = this.props
    const { showOpen, assignedToMe } = this.state
    // const assignedFilter = assignedToMe ? x => x.assignee === this.props.currentUser.bugzillaCreds.login : x => true

    if (isLoading) return <Preloader />
    return (
      <div className='flex flex-column flex-grow full-height'>
        <RootAppBar title='My Reports' onIconClick={() => dispatch(setDrawerState(true))} shadowless />
        <div className='flex flex-column roboto overflow-hidden flex-grow h-100 relative'>
          <div className='bb b--black-10 overflow-auto flex-grow flex flex-column bg-very-light-gray'>
            <div className='flex pl3 pv3 bb b--very-light-gray bg-white'>
              <div
                onClick={() => this.handleStatusClicked(true)}
                className={'f6 fw5 ph2 ' + (showOpen ? 'mid-gray' : 'silver')}
              >
                Open
              </div>
              <div
                onClick={() => this.handleStatusClicked(false)}
                className={'f6 fw5 ml4 ph2 ' + (!showOpen ? 'mid-gray' : 'silver')}
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
            {reportList.length
              ? reportList.map(({ unitTitle, bzId, unitType, hasUnread, cases: unitReports }) => {
                // const isExpanded = expandedUnits.includes(unitTitle)
                return (
                  <div key={unitTitle}>
                    <div className='flex items-center h3 bt b--light-gray bg-white'>
                      <FontIcon className={'material-icons mh3'} color='var(--semi-dark-gray)' style={unitIconsStyle}>
                        home
                      </FontIcon>
                      <div className='flex-grow ellipsis mid-gray mr4'>
                        {unitTitle}
                        <div className='flex justify-space'>
                          <div className={'f6 silver mt1'}>
                            { unitReports.length } report
                          </div>
                          {bzId && (
                            <div className='no-shrink flex items-center'>
                              <Link
                                className='f6 link ellipsis ml3 pl1 mv1 bondi-blue fw5'
                                to={`/report/new?unit=${bzId}`}>
                                Add report
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
              : (<NoItem item={'report'} />)
            }
          </div>
          <div className='absolute right-1 bottom-2'>
            <FloatingActionButton onClick={() => dispatch(push('/unit'))}>
              <FontIcon className='material-icons'>add</FontIcon>
            </FloatingActionButton>
          </div>
        </div>
      </div>
    )
  }
}

ReportExplorer.propTypes = {
  reportList: PropTypes.array
}

let reportsError
export default connect(
  () => ({}) // map redux state to props
)(createContainer(() => { // map meteor state to props
  return {
    reportList: Reports.find().fetch().map(reportItem => Object.assign({}, reportItem, {
      unitType: (UnitMetaData.findOne({bzName: reportItem.selectedUnit}) || {}).unitType,
      selectedUnitBzId: (UnitMetaData.findOne({bzName: reportItem.selectedUnit}) || {}).bzId
    })),
    currentUser: Meteor.subscribe('users.myBzLogin').ready() ? Meteor.user() : null,
    reportsError
  }
}, ReportExplorer))
