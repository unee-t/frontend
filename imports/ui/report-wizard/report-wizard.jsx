import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import { goBack, push, replace } from 'react-router-redux'
import { Redirect, Route } from 'react-router-dom'
import moment from 'moment'
import FontIcon from 'material-ui/FontIcon'
import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton'
import MenuItem from 'material-ui/MenuItem'
import SwipeableViews from 'react-swipeable-views'
import Units, { collectionName as unitsCollName, getUnitRoles } from '../../api/units'
import Reports, { collectionName, REPORT_DRAFT_STATUS } from '../../api/reports'
import Cases, { collectionName as casesCollName } from '../../api/cases'
import Comments, { collectionName as commentsCollName } from '../../api/comments'
import InnerAppBar from '../components/inner-app-bar'
import FileInput from '../components/file-input'
import Preloader from '../preloader/preloader'
import { infoItemMembers, infoItemLabel } from '../util/static-info-rendering'
import { userInfoItem } from '../../util/user'
import { fileInputReaderEventHandler } from '../util/dom-api'
import { makeMatchingUser } from '../../api/custom-users'
import CaseMenuItem from '../components/case-menu-item'
import EditableItem from '../components/editable-item'
import { editReportField, addAttachment, retryAttachment } from './report-wizard.actions'
import { attachmentTextMatcher } from '../../util/matchers'
import { fillDimensions } from '../../util/cloudinary-transformations'
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

const flatButtonReset = {
  minWidth: null,
  padding: null,
  margin: null
}

const tabsOrder = [
  'overview',
  'cases'
]

const TabHeader = ({ isSelected, label, onSelected }) => (
  <div className={'flex-grow transition-bg' + (isSelected ? ' bg-white' : '')}>
    <MenuItem style={{ minHeight: 'auto' }} innerDivStyle={resetMenuItemDivStyle} onClick={onSelected}>
      <div className='mid-gray lh-copy tc f6 fw5 pv2'>
        {label.toUpperCase()}
      </div>
    </MenuItem>
  </div>
)
TabHeader.propTypes = {
  isSelected: PropTypes.bool,
  label: PropTypes.string.isRequired,
  onSelected: PropTypes.func
}

class ReportWizard extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      reportTitle: null,
      isEditable: false
    }
    this.titleUnset = true
  }
  handleSubmit = evt => {
    evt.preventDefault()
    const { reportTitle } = this.state
    const { reportItem, dispatch } = this.props
    dispatch(editReportField(reportItem.id, { title: reportTitle }))
    this.setState({ isEditable: false })
  }

  componentDidUpdate (prevProps, prevState) {
    const { reportItem } = this.props
    if (
      (this.titleUnset && reportItem) ||
      (!prevProps.reportItem && reportItem) ||
      (prevProps.reportItem && prevProps.reportItem.title !== reportItem.title)
    ) {
      this.titleUnset = false
      this.setState({ reportTitle: reportItem.title })
    }

    if (this.state.isEditable && !prevState.isEditable && this.focusableInput) {
      this.focusableInput.focus()
      this.focusableInput.getInputNode().setSelectionRange(0, this.state.reportTitle.length)
    }
  }

  render () {
    const {
      unitItem, reportItem, isLoading, user, dispatch, childCases, match, attachments, attachmentUploads, unitRoles
    } = this.props

    if (isLoading) {
      return <Preloader />
    }

    if (reportItem.status !== REPORT_DRAFT_STATUS) {
      return <Redirect to={`/report/${reportItem.id}/preview`} />
    }

    const { isEditable, reportTitle } = this.state
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
      unitRoles.find(desc => desc.login === user.bugzillaCreds.login)
    )
    return (
      <div className='full-height flex flex-column'>
        <InnerAppBar onBack={() => dispatch(goBack())} title={reportItem.title} />
        <div className='flex-grow flex flex-column bg-white overflow-auto'>
          <div className='pa3 flex flex-column no-shrink'>
            <form onSubmit={this.handleSubmit}>
              <div className='relative'>
                <EditableItem
                  label={isEditable ? 'Edit title' : 'Report title'}
                  disabled={!isEditable}
                  underlineShow={isEditable}
                  currentValue={reportTitle}
                  inpRef={el => { this.focusableInput = el }}
                  onEdit={val => this.setState({ reportTitle: val })}
                />
                {isEditable ? (
                  <div className='absolute right-0 tl f6 bondi-blue fw5'>
                    <FlatButton
                      className='ph2'
                      style={flatButtonReset}
                      onClick={() => this.setState({ isEditable: false, reportTitle: reportItem.title })}
                    >
                      <span className='silver'>Cancel</span>
                    </FlatButton>
                    <FlatButton type='submit' className='ph2 ml2' disabled={!reportTitle} style={flatButtonReset}>
                      <span className={(reportTitle ? 'bondi-blue' : 'silver')} >
                        Save
                      </span>
                    </FlatButton>
                  </div>
                ) : (
                  <div className='absolute bottom-1 right-0 tl'>
                    <FontIcon className='material-icons' color='var(--silver)' onClick={() => this.setState({ isEditable: true })}>create</FontIcon>
                  </div>
                )}
              </div>
            </form>
            <div>
              {infoItemMembers('Unit', unitDisplayName)}
            </div>
          </div>
          <Route path={`${match.url}/:tabName`} children={({ match: subMatch }) => {
            const tabIndex = subMatch ? tabsOrder.indexOf(subMatch.params.tabName) : 0
            return (
              <div className='bg-very-light-gray no-shrink flex flex-column'>
                <div className='pt1 flex bt b--transparent'>
                  <TabHeader
                    label='overview'
                    isSelected={tabIndex === 0}
                    onSelected={() => dispatch(replace(`${match.url}/${tabsOrder[0]}`))}
                  />
                  <TabHeader
                    label='cases'
                    isSelected={tabIndex === 1}
                    onSelected={() => dispatch(replace(`${match.url}/${tabsOrder[1]}`))}
                  />
                </div>
                <div className='bg-white pa3 flex flex-column no-shrink'>
                  <SwipeableViews
                    resistance
                    index={tabIndex}
                    onChangeIndex={idx => dispatch(replace(`${match.url}/${tabsOrder[idx]}`))}
                  >
                    <div className='flex flex-column pb3'>
                      <div>
                        <EditableItem
                          label='Remarks and Comments'
                          initialValue={reportItem.additionalComments}
                          onEdit={val => dispatch(editReportField(reportItem.id, { additionalComments: val }))}
                          isMultiLine
                        />
                      </div>
                      <div className='mt3'>
                        {infoItemLabel('Attach Photos:')}
                        <div className='flex flex-wrap pt1'>
                          {attachments.map(({ text, id }) => (
                            <div className='mt2 mr2' key={id}>
                              <MenuItem
                                innerDivStyle={resetMenuItemDivStyle}
                                onClick={() => dispatch(push(`/report/${reportItem.id}/attachment/${id}`))}
                              >
                                <img
                                  className='h3-5 border-box w3-5 ba b--moon-gray'
                                  src={fillDimensions(text.split('\n')[1], 96, 96)} alt='X'
                                />
                              </MenuItem>
                            </div>
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
                          <div className='mt2'>
                            <MenuItem innerDivStyle={resetMenuItemDivStyle}>
                              <FileInput onFileSelected={fileInputReaderEventHandler(
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
                        </div>
                      </div>
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
                    <div className='flex flex-column'>
                      <div className='f6 mid-gray lh-copy'>
                        Create a new case for each issue that needs to be fixed.
                      </div>
                      <div className='pv2'>
                        <div className={'b dark-gray lh-copy' + (childCases.length ? ' pb2 bb b--very-light-gray' : '')}>
                          Cases for the overall unit
                        </div>
                        {childCases.map(caseItem => (
                          <CaseMenuItem key={caseItem.id} caseItem={caseItem} onClick={() => {
                            dispatch(push(`/case/${caseItem.id}`))
                          }} />
                        ))}
                        {makeCreationButton(
                          'Create case',
                          () => dispatch(push(`/case/new?unit=${unitItem.id}&report=${reportItem.id}`))
                        )}
                      </div>
                    </div>
                  </SwipeableViews>
                </div>
              </div>
            )
          }} />
        </div>
        <div className='bg-white tr scroll-shadow-1 z-999'>
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
  user: PropTypes.object,
  attachments: PropTypes.array,
  attachmentUploads: PropTypes.array.isRequired,
  unitRoles: PropTypes.array
}

export default connect(
  ({ attachmentUploads }, props) => ({
    attachmentUploads: attachmentUploads[props.match.params.reportId.toString()] || []
  })
)(
  createContainer(props => {
    const { reportId } = props.match.params
    const reportHandle = Meteor.subscribe(`${collectionName}.byId`, reportId)
    const reportItem = reportHandle.ready() ? Reports.findOne({ id: parseInt(reportId) }) : null
    const commentsHandle = Meteor.subscribe(`${commentsCollName}.byCaseId`, reportId)
    const bzLoginHandle = Meteor.subscribe('users.myBzLogin')
    let unitHandle, childHandles
    if (reportItem) {
      unitHandle = Meteor.subscribe(`${unitsCollName}.byNameWithRoles`, reportItem.selectedUnit)
      childHandles = reportItem.depends_on.map(
        caseId => Meteor.subscribe(`${casesCollName}.byId`, caseId)
      )
    }
    const currUnit = reportItem ? Units.findOne({ name: reportItem.selectedUnit }) : null
    return {
      isLoading: !reportHandle.ready() ||
        (unitHandle && !unitHandle.ready()) ||
        !bzLoginHandle.ready() ||
        !commentsHandle.ready() ||
        childHandles.filter(handle => !handle.ready()).length > 0,
      unitItem: currUnit,
      unitRoles: currUnit ? getUnitRoles(currUnit, Meteor.userId()) : null,
      childCases: reportItem ? Cases.find({
        id: {
          $in: reportItem.depends_on
        }
      }).fetch() : null,
      user: Meteor.user(),
      attachments: Comments.find({ bug_id: parseInt(reportId) }).fetch().reduce((all, curr) => {
        if (attachmentTextMatcher(curr.text)) {
          all.push(curr)
        }
        return all
      }, []),
      reportItem
    }
  }, ReportWizard)
)
