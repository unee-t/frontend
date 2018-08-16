import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import { goBack, push, replace } from 'react-router-redux'
import { Route } from 'react-router-dom'
import moment from 'moment'
import FontIcon from 'material-ui/FontIcon'
import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton'
import Units, { collectionName as unitsCollName, getUnitRoles } from '../../api/units'
import Reports, { collectionName, REPORT_DRAFT_STATUS, REPORT_FINAL_STATUS } from '../../api/reports'
import Cases, { collectionName as casesCollName } from '../../api/cases'
import InnerAppBar from '../components/inner-app-bar'
import Preloader from '../preloader/preloader'
import { infoItemMembers, infoItemLabel } from '../util/static-info-rendering'
import { userInfoItem } from '../../util/user'
import { makeMatchingUser } from '../../api/custom-users'
import CaseMenuItem from '../components/case-menu-item'
import EditableItem from '../components/editable-item'
import ConfirmationDialog from '../dialogs/confirmation-dialog'
import { storeBreadcrumb } from '../general-actions'
import { finalizeReport, editReportField } from './report-wizard.actions'

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
  componentDidUpdate (prevProps) {
    const { isLoading, match, reportItem, dispatch } = this.props
    if (!isLoading && prevProps.isLoading !== isLoading) {
      const { viewMode } = match.params
      let enforcedViewMode
      if (reportItem.status === REPORT_DRAFT_STATUS && viewMode !== 'draft') {
        enforcedViewMode = 'draft'
      } else if (reportItem.status === REPORT_FINAL_STATUS && viewMode !== 'review') {
        enforcedViewMode = 'review'
      }
      if (enforcedViewMode) {
        dispatch(replace(match.url.replace(viewMode, enforcedViewMode)))
      }
    }
  }
  render () {
    const { unitItem, reportItem, isLoading, user, dispatch, childCases, match } = this.props

    if (isLoading) {
      return <Preloader />
    }

    const isDraft = reportItem.status === REPORT_DRAFT_STATUS
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
        <div className='flex-grow bg-very-light-gray flex flex-column overflow-auto pb2'>
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
          {(isDraft || (!isDraft && childCases.length > 0)) && ( // Show only if draft or final but with cases
            <div className='bg-white card-shadow-1 ph3 pv2 mt2'>
              <div className={'b dark-gray lh-copy' + (childCases.length ? ' pb2 bb b--very-light-gray' : '')}>
                {isDraft
                  ? 'Would you like to report any issue with the unit?'
                  : 'Cases related to this report'
                }
              </div>
              {childCases.map(caseItem => (
                <CaseMenuItem key={caseItem.id} caseItem={caseItem} onClick={() => {
                  dispatch(storeBreadcrumb(match.url))
                  dispatch(push(`/case/${caseItem.id}`))
                }} />
              ))}
              {isDraft && makeCreationButton(
                'Add case',
                () => dispatch(push(`/case/new?unit=${unitItem.id}&report=${reportItem.id}`))
              )}
            </div>
          )}
          {/* <div className='bg-white card-shadow-1 ph3 pv2 mt2'>
            {infoItemLabel('Rooms')}
            <div className='moon-gray f7 mt2'>
              There are no rooms added to this Inspection Report yet. Click
              Add room to begin.
            </div>
            {makeCreationButton('Add room', () => {})}
          </div> */}
          {(isDraft || reportItem.additionalComments) && (
            <div className='bg-white card-shadow-1 ph3 pb2 mt2'>
              {isDraft ? (
                <EditableItem
                  label='Additional Comments'
                  initialValue={reportItem.additionalComments}
                  onEdit={val => dispatch(editReportField(reportItem.id, {additionalComments: val}))}
                  isMultiLine
                />
              ) : (
                <div className='mt3'>
                  {infoItemMembers('Additional Comments', reportItem.additionalComments)}
                </div>
              )}
            </div>
          )}
        </div>
        <div className='bg-white ph3 pb3 pt4 tr scroll-shadow-1 z-999'>
          <div className='dib flex justify-end items-center'>
            {isDraft ? (
              <RaisedButton
                primary
                onClick={() => dispatch(push(`${match.url}/confirm`))}
              >
                <span className='white mh4'>
                  Complete
                </span>
              </RaisedButton>
            ) : [
              (
                <div key='text' className='f5 i moon-gray'>
                  This report has been finalized
                </div>
              ),
              (
                <FontIcon key='icon' className='material-icons ml2' color='var(--success-green)'>
                  check_circle
                </FontIcon>
              )
            ]}
          </div>
        </div>
        {isDraft && (
          <Route exact path={`${match.url}/confirm`} children={({ match }) => (
            <ConfirmationDialog
              show={!!match}
              title='Are you sure it is complete?'
              onConfirm={() => dispatch(finalizeReport(reportItem.id))}
              onCancel={() => dispatch(goBack())}
            >
              <div className='near-black'>
                You will not be able to make any further changes to this version of the report
              </div>
            </ConfirmationDialog>
          )} />
        )}
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
