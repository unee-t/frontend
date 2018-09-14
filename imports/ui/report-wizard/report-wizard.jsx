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
import MenuItem from 'material-ui/MenuItem'
import Units, { collectionName as unitsCollName, getUnitRoles } from '../../api/units'
import Reports, { collectionName, REPORT_DRAFT_STATUS } from '../../api/reports'
import Cases, { collectionName as casesCollName } from '../../api/cases'
import Comments, { collectionName as commentsCollName } from '../../api/comments'
import InnerAppBar from '../components/inner-app-bar'
import FileInput from '../components/file-input'
import Preloader from '../preloader/preloader'
import { infoItemMembers, infoItemLabel } from '../util/static-info-rendering'
import { userInfoItem } from '../../util/user'
import { imageInputEventHandler } from '../util/dom-api'
import { makeMatchingUser } from '../../api/custom-users'
import CaseMenuItem from '../components/case-menu-item'
import EditableItem from '../components/editable-item'
import ConfirmationDialog from '../dialogs/confirmation-dialog'
import { storeBreadcrumb } from '../general-actions'
import { finalizeReport, editReportField, addAttachment, retryAttachment } from './report-wizard.actions'
import { attachmentTextMatcher } from '../../util/matchers'
import { fitDimensions } from '../../util/cloudinary-transformations'
import UploadPreloader from '../components/upload-preloader'

import { resetMenuItemDivStyle } from '../general.mui-styles'

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
      isEditable: false,
      initDone: false
    }
  }
  handleSubmit = evt => {
    evt.preventDefault()
    const { reportTitle } = this.state
    const { reportItem, dispatch } = this.props
    dispatch(editReportField(reportItem.id, {title: reportTitle}))
    this.setState({isEditable: false})
  }

  componentDidUpdate (prevProps) {
    const { isLoading, match, reportItem, dispatch } = this.props
    if (!isLoading && prevProps.isLoading !== isLoading) {
      const { viewMode } = match.params
      let enforcedViewMode
      if (reportItem.status === REPORT_DRAFT_STATUS && viewMode !== 'draft') {
        enforcedViewMode = 'draft'
      } else if (reportItem.status !== REPORT_DRAFT_STATUS && viewMode !== 'review') {
        enforcedViewMode = 'review'
      }
      if (enforcedViewMode) {
        dispatch(replace(match.url.replace(viewMode, enforcedViewMode)))
      }
    }
    if ((!prevProps.reportItem && reportItem) || (prevProps.reportItem && prevProps.reportItem.title !== reportItem.title)) {
      this.setState({reportTitle: reportItem.title})
    }
  }

  render () {
    const {
      unitItem, reportItem, isLoading, user, dispatch, childCases, match, attachmentUrls, attachmentUploads
    } = this.props

    if (isLoading) {
      return <Preloader />
    }
    const { isEditable, reportTitle } = this.state
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
        <div className='flex-grow bg-white flex flex-column overflow-auto pa3'>
          <div>
            { isEditable ? (
              <div>
                <form onSubmit={this.handleSubmit}>
                  <div className='relative'>
                    <div className='mt1 f6 bondi-blue'>Edit title</div>
                    <EditableItem
                      label=''
                      name={reportItem.title}
                      key={reportItem.title}
                      initialValue={reportTitle}
                      onEdit={val => this.setState({reportTitle: val})}
                    />
                    <div className='absolute right-0 tl f6 bondi-blue fw5'>
                      <FlatButton onClick={() => this.setState({isEditable: false, reportTitle: reportItem.title})} style={{minWidth: '50px'}}>
                        <span className='silver'> Cancel</span>
                      </FlatButton>
                      <FlatButton type='submit' style={{minWidth: '50px'}} disabled={!reportTitle}>
                        <span className={(reportTitle ? 'bondi-blue' : 'silver')} >
                          Save
                        </span>
                      </FlatButton>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              <div className='relative'>
                {infoItemMembers('Report title', reportTitle)}
                <div className='absolute bottom-1 right-0 tl'>
                  <FontIcon className='material-icons' color='var(--silver)' onClick={() => this.setState({isEditable: true})}>create</FontIcon>
                </div>
              </div>
            )}
          </div>
          <div>
            {infoItemMembers('Unit', unitDisplayName)}
          </div>
          {(isDraft || reportItem.additionalComments) && (isDraft ? (
            <div>
              <EditableItem
                label='Remarks and Comments'
                initialValue={reportItem.additionalComments}
                onEdit={val => dispatch(editReportField(reportItem.id, {additionalComments: val}))}
                isMultiLine
              />
            </div>
          ) : (
            <div className='mt3'>
              {infoItemMembers('Remarks and Comments', reportItem.additionalComments)}
            </div>
          ))}
          {(isDraft || (!isDraft && attachmentUrls.length > 0)) && (
            <div className='mt3'>
              {infoItemLabel(isDraft ? 'Attach Photos:' : 'Photos:')}
              <div className='flex flex-wrap pt1'>
                {attachmentUrls.map(url => (
                  <img
                    key={url}
                    className='mt2 mr2 h3-5 border-box w3-5 ba b--moon-gray'
                    src={fitDimensions(url, 96, 96)} alt='X'
                  />
                ))}
                {attachmentUploads.map(process => (
                  <div
                    key={process.processId}
                    className='relative mt2 mr2 h3-5 border-box w3-5 ba b--moon-gray overflow-hidden flex justify-center'
                  >
                    <img className='min-w-100 min-h-100 obj-cover' src={process.preview} />
                    <UploadPreloader process={process} handleRetryUpload={() => dispatch(retryAttachment(process))} />
                  </div>
                ))}
                {isDraft && (
                  <div className='mt2'>
                    <MenuItem innerDivStyle={resetMenuItemDivStyle}>
                      <FileInput onFileSelected={imageInputEventHandler(
                        (preview, file) => dispatch(addAttachment(reportItem.id, preview, file))
                      )}>
                        <div className='h3-5 w3-5 flex flex-column items-center justify-center ba b--moon-gray'>
                          <FontIcon className='material-icons' color='var(--light-silver)'>
                            add_a_photo
                          </FontIcon>
                          <div className='light-silver f7 tc mt1'>
                            Add new
                          </div>
                        </div>
                      </FileInput>
                    </MenuItem>
                  </div>
                )}
              </div>
            </div>
          )}
          {(isDraft || (!isDraft && childCases.length > 0)) && ( // Show only if draft or final but with cases
            <div className='pv2 mt2'>
              <div className={'b dark-gray lh-copy' + (childCases.length ? ' pb2 bb b--very-light-gray' : '')}>
                {isDraft
                  ? 'Is there any defect which needs to be corrected or fixed?'
                  : 'Defects reported on creation'
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
          {/* <div className='ph3 pv2 mt2'>
            {infoItemLabel('Rooms')}
            <div className='moon-gray f7 mt2'>
              There are no rooms added to this Inspection Report yet. Click
              Add room to begin.
            </div>
            {makeCreationButton('Add room', () => {})}
          </div> */}
          <div className='mt2 pt1'>
            {infoItemLabel('Created by')}
            {userInfoItem(userInfo, null, () => moment(reportItem.creation_time).format('YYYY-MM-DD'))}
          </div>
        </div>
        <div className='bg-white tr scroll-shadow-1 z-999'>
          {isDraft ? (
            <div className='dib ph3 pb3 pt4 flex justify-end items-center'>
              <div className='flex-grow'>
                <RaisedButton
                  fullWidth
                  onClick={() => dispatch(goBack())}
                >
                  <span className='bondi-blue mh4'>
                    Save Draft
                  </span>
                </RaisedButton>
              </div>
              <div className='flex-grow ml2'>
                <RaisedButton
                  primary
                  fullWidth
                  onClick={() => dispatch(push(`/report/${reportItem.id}/preview`))}
                >
                  <span className='white mh4'>
                    Preview
                  </span>
                </RaisedButton>
              </div>
            </div>
          ) : (
            <div className='dib ph3 pb3 pt2'>
              <div className='flex justify-end items-center'>
                <div key='text' className='f5 i moon-gray'>
                  This report has been finalized
                </div>
                <FontIcon key='icon' className='material-icons ml2' color='var(--success-green)'>
                  check_circle
                </FontIcon>
              </div>
              <div className='tr mt2'>
                <RaisedButton
                  primary
                  onClick={() => dispatch(push(`/report/${reportItem.id}/preview`))}
                >
                  <span className='white mh4'>
                    Preview & Endorse
                  </span>
                </RaisedButton>
              </div>
            </div>
          )}
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
  user: PropTypes.object,
  attachmentUrls: PropTypes.array,
  attachmentUploads: PropTypes.array.isRequired
}

export default connect(
  ({ attachmentUploads }, props) => ({
    attachmentUploads: attachmentUploads[props.match.params.reportId.toString()] || []
  })
)(
  createContainer(props => {
    const { reportId } = props.match.params
    const reportHandle = Meteor.subscribe(`${collectionName}.byId`, reportId)
    const reportItem = reportHandle.ready() ? Reports.findOne({id: parseInt(reportId)}) : null
    const commentsHandle = Meteor.subscribe(`${commentsCollName}.byCaseId`, reportId)
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
        !commentsHandle.ready() ||
        childHandles.filter(handle => !handle.ready()).length > 0,
      unitItem: reportItem ? Units.findOne({name: reportItem.selectedUnit}) : null,
      childCases: reportItem ? Cases.find({
        id: {
          $in: reportItem.depends_on
        }
      }).fetch() : null,
      user: Meteor.user(),
      attachmentUrls: Comments.find({bug_id: parseInt(reportId)}).fetch().reduce((all, curr) => {
        if (attachmentTextMatcher(curr.text)) {
          all.push(curr.text.split('\n')[1])
        }
        return all
      }, []),
      reportItem
    }
  }, ReportWizard)
)
