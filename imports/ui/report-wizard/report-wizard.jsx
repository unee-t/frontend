import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import { goBack, push } from 'react-router-redux'
import moment from 'moment'
import FontIcon from 'material-ui/FontIcon'
import FlatButton from 'material-ui/FlatButton'
import Units, { collectionName as unitsCollName, getUnitRoles } from '../../api/units'
import Reports, { collectionName } from '../../api/reports'
import Cases, { collectionName as casesCollName } from '../../api/cases'
import InnerAppBar from '../components/inner-app-bar'
import Preloader from '../preloader/preloader'
import { infoItemMembers, infoItemLabel } from '../util/static-info-rendering'
import { userInfoItem } from '../../util/user'
import { makeMatchingUser } from '../../api/custom-users'
import CaseMenuItem from '../components/case-menu-item'
import { storeBreadcrumb } from '../general-actions'

const addIconStyle = {
  fontSize: '1rem',
  color: 'var(--bondi-blue)',
  lineHeight: '1.5rem'
}
const makeCreationButton = (label, onClick) => (
  <FlatButton onClick={onClick}>
    <div className='flex items-center'>
      <FontIcon className='material-icons' style={addIconStyle}>add_box</FontIcon>
      <div className='bondi-blue lh-copy ml1'>{label}</div>
    </div>
  </FlatButton>
)

class ReportWizard extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      reportTitle: null,
      initDone: false
    }
  }
  render () {
    const { unitItem, reportItem, isLoading, user, dispatch, childCases, match } = this.props

    if (isLoading) {
      return <Preloader />
    }
    const memberIdMatcher = ({ id }) => id === user._id
    const unitDisplayName = (unitItem.metaData() && unitItem.metaData().displayName) || unitItem.name
    const matchingMongoRole = unitItem.rolesData().find(
      role => role.members.find(memberIdMatcher)
    )
    const userInfo = matchingMongoRole ? {
      login: user.bugzillaCreds.login,
      name: user.profile.name,
      role: matchingMongoRole.roleType,
      isOccupant: matchingMongoRole.members.find(memberIdMatcher).isOccupant
    } : makeMatchingUser(
      getUnitRoles(unitItem).find(desc => desc.login === user.bugzillaCreds.login)
    )
    return (
      <div className='full-height flex flex-column'>
        <InnerAppBar onBack={() => dispatch(goBack())} title={reportItem.title} />
        <div className='flex-grow bg-very-light-gray overflow-auto'>
          <div className='bg-white card-shadow-1 pa3'>
            <div>
              {infoItemMembers('Report title', reportItem.title)}
            </div>
            <div>
              {infoItemMembers('Unit', unitDisplayName)}
            </div>
            <div className='pt1'>
              {infoItemMembers('Created on', moment(reportItem.creation_time).format('DD/MM/YYYY'))}
            </div>
            <div className='mt2 pt1'>
              {infoItemLabel('Created by')}
              {userInfoItem(userInfo)}
            </div>
          </div>
          <div className='bg-white card-shadow-1 ph3 pv2 mt2'>
            <div className={'b dark-gray lh-copy' + (childCases.length ? ' pb2 bb b--very-light-gray' : '')}>
              Would you like to report any issue with the unit?
            </div>
            {childCases.map(caseItem => (
              <CaseMenuItem key={caseItem.id} caseItem={caseItem} onClick={() => {
                dispatch(storeBreadcrumb(match.url))
                dispatch(push(`/case/${caseItem.id}`))
              }} />
            ))}
            {makeCreationButton(
              'Add case',
              () => dispatch(push(`/case/new?unit=${unitItem.id}&report=${reportItem.id}`))
            )}
          </div>
          {/* <div className='bg-white card-shadow-1 ph3 pv2 mt2'>
            {infoItemLabel('Rooms')}
            <div className='moon-gray f7 mt2'>
              There are no rooms added to this Inspection Report yet. Click
              Add room to begin.
            </div>
            {makeCreationButton('Add room', () => {})}
          </div> */}
        </div>
      </div>
    )
  }
}

ReportWizard.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  unitItem: PropTypes.object,
  reportItem: PropTypes.object,
  childCases: PropTypes.array,
  user: PropTypes.object
}

export default connect(
  () => ({})
)(
  createContainer(props => {
    const { reportId } = props.match.params
    const reportHandle = Meteor.subscribe(`${collectionName}.byId`, reportId)
    const reportItem = reportHandle.ready() ? Reports.findOne({id: parseInt(reportId)}) : null
    const bzLoginHandle = Meteor.subscribe('users.myBzLogin')
    let unitHandle, childHandles
    if (reportItem) {
      unitHandle = Meteor.subscribe(`${unitsCollName}.byNameWithRoles`, reportItem.selectedUnit)
      childHandles = reportItem.depends_on.map(
        caseId => Meteor.subscribe(`${casesCollName}.byId`, caseId)
      )
    }
    return {
      isLoading: !reportHandle.ready() ||
        (unitHandle && !unitHandle.ready()) ||
        !bzLoginHandle.ready() ||
        childHandles.filter(handle => !handle.ready()).length > 0,
      unitItem: reportItem ? Units.findOne({name: reportItem.selectedUnit}) : null,
      childCases: reportItem ? Cases.find({
        id: {
          $in: reportItem.depends_on
        }
      }).fetch() : null,
      user: Meteor.user(),
      reportItem
    }
  }, ReportWizard)
)
