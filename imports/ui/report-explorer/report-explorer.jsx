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
import Reports, { collectionName } from '../../api/reports'
import UnitMetaData from '../../api/unit-meta-data'
import Preloader from '../preloader/preloader'
import { setDrawerState } from '../general-actions'
import Units, { collectionName as unitsCollName } from '../../api/units'
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
      draftStatus: true,
      createdByMe: false
    }
  }

  handleStatusClicked (value) {
    this.setState({ draftStatus: value })
  }

  handleAssignedClicked () {
    this.setState({ createdByMe: !this.state.createdByMe })
  }

  render () {
    const { isLoading, dispatch, reportList, currentUser } = this.props
    const { draftStatus, createdByMe } = this.state
    const statusFilter = draftStatus ? report => report.status === 'UNCONFIRMED' : report => report.status === 'CONFIRMED'
    const creatorFilter = createdByMe ? x => x.assignee === currentUser.bugzillaCreds.login : x => true
    const filteredReports = reportList.filter(x => statusFilter(x) && creatorFilter(x))

    if (isLoading) return <Preloader />
    return (
      <div className='flex flex-column flex-grow full-height'>
        <RootAppBar title='My Reports' onIconClick={() => dispatch(setDrawerState(true))} shadowless />
        <div className='flex flex-column roboto overflow-hidden flex-grow h-100 relative'>
          <div className='bb b--black-10 overflow-auto flex-grow flex flex-column bg-very-light-gray'>
            <div className='flex pl3 pv3 bb b--very-light-gray bg-white'>
              <div
                onClick={() => this.handleStatusClicked(true)}
                className={'f6 fw5 ph2 ' + (draftStatus ? 'mid-gray' : 'silver')}
              >
                Draft
              </div>
              <div
                onClick={() => this.handleStatusClicked(false)}
                className={'f6 fw5 ml4 ph2 ' + (!draftStatus ? 'mid-gray' : 'silver')}
              >
                Finalized
              </div>
              <div
                onClick={() => this.handleAssignedClicked()}
                className={'f6 fw5 ml4 ph2 ' + (createdByMe ? 'mid-gray' : 'silver')}
              >
                Created By Me
              </div>
            </div>
            {filteredReports.length
              ? filteredReports.map(({ selectedUnit }) => {
                return (
                  <div key={selectedUnit}>
                    <div className='flex items-center h3 bt b--light-gray bg-white'>
                      <FontIcon className={'material-icons mh3'} color='var(--semi-dark-gray)' style={unitIconsStyle}>
                        home
                      </FontIcon>
                      <div className='flex-grow ellipsis mid-gray mr4'>
                        {selectedUnit}
                        <div className='flex justify-space'>
                          <div className={'f6 silver mt1'}>
                            report
                          </div>
                          {(
                            <div className='no-shrink flex items-center'>
                              <Link
                                className='f6 link ellipsis ml3 pl1 mv1 bondi-blue fw5'
                                to={`/report/new?unit=`}>
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
  const reportsHandle = Meteor.subscribe(`${collectionName}.associatedWithMe`, {
    onStop: (error) => {
      reportsError = error
    }
  })
  return {
    reportList: Reports.find().fetch().map(reportItem => Object.assign({}, reportItem, {
      unitHandle: Meteor.subscribe(`${unitsCollName}.byNameWithRoles`, reportItem.selectedUnit)
    })),
    isLoading: !reportsHandle.ready(),
    unitMetaData: UnitMetaData.find().fetch(),
    unitFind: Units.find().fetch(),
    currentUser: Meteor.subscribe('users.myBzLogin').ready() ? Meteor.user() : null,
    reportsError
  }
}, ReportExplorer))
