import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import { goBack, push } from 'react-router-redux'
import CircularProgress from 'material-ui/CircularProgress'
import RaisedButton from 'material-ui/RaisedButton'

import Reports, { collectionName, REPORT_DRAFT_STATUS } from '../../api/reports'
import InnerAppBar from '../components/inner-app-bar'
import Preloader from '../preloader/preloader'
import { generateHTMLPreview } from './report-preview.actions'

class ReportPreview extends Component {
  componentDidMount () {
    const { match, dispatch } = this.props
    dispatch(generateHTMLPreview(match.params.reportId))
  }
  render () {
    const { isLoading, reportItem, dispatch, previewIsLoading, previewUrl } = this.props
    if (isLoading) {
      return <Preloader />
    }

    const isDraft = reportItem.status === REPORT_DRAFT_STATUS
    return (
      <div className='full-height flex flex-column'>
        <InnerAppBar onBack={() => dispatch(goBack())} title={reportItem.title} />
        <div className='flex-grow flex flex-column'>
          {previewIsLoading ? (
            <div className='flex-grow flex items-center justify-center'>
              <CircularProgress size={70} thickness={5} />
            </div>
          ) : previewUrl && (
            <div className='flex-grow overflow-auto'>
              <iframe className='bn w-100 h-100' src={previewUrl} />
            </div>
          )}
          <div className='bg-white scroll-shadow-2 pa3 tc z-999'>
            {isDraft ? (
              <div>
                <RaisedButton
                  primary
                  fullWidth
                  onClick={() => dispatch(push(`/report/${reportItem.id}/sign`))}
                >
                  <span className='white mh4'>
                    Sign Report
                  </span>
                </RaisedButton>
                <div className='mt3'>
                  <a className='link bondi-blue' onClick={() => dispatch(goBack())}>
                    Continue editing report
                  </a>
                </div>
              </div>
            ) : (
              <RaisedButton
                primary
                fullWidth
                onClick={() => dispatch(push(`/report/${reportItem.id}/share`))}
              >
                <span className='white mh4'>
                  Share report
                </span>
              </RaisedButton>
            )}
          </div>
        </div>
      </div>
    )
  }
}

ReportPreview.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  previewIsLoading: PropTypes.bool.isRequired,
  reportItem: PropTypes.object,
  previewUrl: PropTypes.string
}

export default connect(
  ({ reportPreviewUrls }, props) => {
    const { reportId } = props.match.params
    const previewInfo = reportPreviewUrls[reportId.toString()]
    return {
      previewIsLoading: !!previewInfo && !!previewInfo.inProgress,
      previewUrl: previewInfo && previewInfo.url
    }
  }
)(
  createContainer(props => {
    const { reportId } = props.match.params
    const reportHandle = Meteor.subscribe(`${collectionName}.byId`, reportId)
    return {
      isLoading: !reportHandle.ready(),
      reportItem: Reports.findOne({id: parseInt(reportId)})
    }
  }, ReportPreview)
)
