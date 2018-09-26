import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import PropTypes from 'prop-types'
import { goBack } from 'react-router-redux'
import FontIcon from 'material-ui/FontIcon'
import RaisedButton from 'material-ui/RaisedButton'

import Reports, { collectionName } from '../../api/reports'
import ReportSnapshots, { collectionName as snapsCollName } from '../../api/report-snapshots'
import Units, { getUnitRoles, collectionName as unitsCollName } from '../../api/units'
import InnerAppBar from '../components/inner-app-bar'
import UserSelectionBox from '../components/user-selection-box'
import Preloader from '../preloader/preloader'
import PdfIcon from '../components/pdf-icon'
import TagInput from '../components/tag-input'
import { emailValidator } from '../../util/validators'

class ReportShare extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      selectedRecipients: [],
      newRecipients: []
    }
  }
  render () {
    const { dispatch, reportItem, isLoading, unitUsers, pdfUrl } = this.props
    const { selectedRecipients, newRecipients, tagInputError } = this.state
    if (isLoading) return <Preloader />

    return (
      <div className='full-height flex flex-column'>
        <InnerAppBar title='Share Report' onBack={() => dispatch(goBack())} />
        <div className='flex-grow flex flex-column pa3'>
          <div className='flex items-center'>
            <PdfIcon />
            <div className='ml2 flex-grow mid-gray'>
              {reportItem.title}
            </div>
            <div className='ml2'>
              <a
                className='link pa2 outline-0'
                href={`/api/report-pdf-download?reportPdfUrl=${encodeURIComponent(pdfUrl)}`}
                download={`${reportItem.title}.pdf`}
              >
                <FontIcon className='material-icons' color='var(--bondi-blue)'>
                  get_app
                </FontIcon>
              </a>
            </div>
          </div>
          <h3 className='near-black f4 fw5'>Who would you like to send it to?</h3>
          <UserSelectionBox
            usersList={unitUsers}
            onUserClick={user => this.setState({
              selectedRecipients: selectedRecipients.includes(user.login)
                ? selectedRecipients.filter(u => u !== user.login)
                : selectedRecipients.concat([user.login])
            })}
            userStatusRenderer={user => (
              <div className='flex flex-column items-center justify-center'>
                {selectedRecipients.includes(user.login) ? (
                  <FontIcon className='material-icons' color='var(--success-green)'>check_circle</FontIcon>
                ) : (
                  <FontIcon className='material-icons' color='var(--silver)'>panorama_fish_eye</FontIcon>
                )}
              </div>
            )}
          />
          <h5 className='mid-gray ma0 mt3'>
            Also send report to the following recipients:
          </h5>
          <TagInput
            className='mt2'
            tags={newRecipients}
            onTagsChanged={tags => this.setState({newRecipients: tags})}
            validator={value => {
              if (!emailValidator(value)) {
                return 'Not a valid email address'
              }
              if (newRecipients.includes(value)) {
                return 'Email already present'
              }
            }}
            onErrorStateChanged={hasError => this.setState({tagInputError: hasError})}
          />
          <div className='mt3'>
            <RaisedButton
              primary
              fullWidth
              disabled={tagInputError || (selectedRecipients.length === 0 && newRecipients.length === 0)}
              onClick={() => console.log('click')}
            >
              <span className='f4 white'>Send report</span>
            </RaisedButton>
          </div>
        </div>
      </div>
    )
  }
}

ReportShare.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  reportItem: PropTypes.object,
  unitUsers: PropTypes.array,
  pdfUrl: PropTypes.string
}

export default connect(
  () => ({})
)(createContainer(
  props => {
    const reportId = parseInt(props.match.params.reportId)
    const reportHandle = Meteor.subscribe(`${collectionName}.byId`, reportId)
    const reportItem = Reports.findOne({id: reportId})
    const snapHandle = Meteor.subscribe(`${snapsCollName}.byReportIdJustUrls`, reportId)
    let unitHandle, unitItem
    if (reportItem) {
      unitHandle = Meteor.subscribe(`${unitsCollName}.byNameWithUsers`, reportItem.selectedUnit)
      unitItem = Units.findOne({name: reportItem.selectedUnit})
    }
    return {
      isLoading: !reportHandle.ready() || (unitHandle && !unitHandle.ready()) || !snapHandle.ready(),
      unitUsers: unitItem && getUnitRoles(unitItem),
      pdfUrl: snapHandle.ready() ? ReportSnapshots.findOne({'reportItem.id': reportId}).pdfUrl : '',
      reportItem
    }
  },
  ReportShare
))
