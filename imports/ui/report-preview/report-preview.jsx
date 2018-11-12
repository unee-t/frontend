// @flow
import * as React from 'react'
import { Meteor } from 'meteor/meteor'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import { goBack, push } from 'react-router-redux'
import CircularProgress from 'material-ui/CircularProgress'
import RaisedButton from 'material-ui/RaisedButton'
import FontIcon from 'material-ui/FontIcon'

import Reports, { collectionName, REPORT_DRAFT_STATUS } from '../../api/reports'
import InnerAppBar from '../components/inner-app-bar'
import ChangeLogoDialog from '../dialogs/change-logo-dialog'
import Preloader from '../preloader/preloader'
import { generateHTMLPreview } from './report-preview.actions'

type Props = {
  isLoading: boolean,
  previewIsLoading: boolean,
  reportItem: any,
  match: any,
  dispatch: (action: any) => void,
  previewUrl: string
}

type State = {
  showLogoAction: boolean,
  showChangeLogoDialog: boolean
}
class ReportPreview extends React.Component<Props, State> {
  state = {
    showLogoAction: false,
    showChangeLogoDialog: false
  }

  componentDidMount () {
    const { match, dispatch } = this.props
    dispatch(generateHTMLPreview(match.params.reportId))
  }

  render () {
    const { isLoading, reportItem, dispatch, previewIsLoading, previewUrl } = this.props
    const { showLogoAction, showChangeLogoDialog } = this.state
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
            <div className='flex-grow overflow-auto relative'>
              <div className='absolute top-0 bottom-0 right-0 left-0'>
                <iframe className='bn w-100 h-100' src={previewUrl} />
              </div>
              <div className='absolute left-0 top-0 flex flex-column pl1 pt1'>
                <div className='ba b--mid-gray b--dashed br2 bw1 w-content' onClick={() => {
                  this.setState({
                    showLogoAction: !showLogoAction
                  })
                }}>
                  <div className='h3 w2 mh2' />
                </div>
                {showLogoAction && (
                  <div
                    className='mt1 bg-black-70 br2 white pa2 lh-title f6 b flex items-end'
                    onClick={() => this.setState({ showChangeLogoDialog: true })}
                  >
                    <FontIcon className='material-icons' color='#fff'>camera_alt</FontIcon>
                    <div className='ml1'>
                      Add photo or logo
                    </div>
                  </div>
                )}
              </div>
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
        <ChangeLogoDialog
          title='Add Photo Or Logo To Report'
          show={showChangeLogoDialog}
          onConfirm={() => {}}
          onClose={() => this.setState({ showChangeLogoDialog: false })}
        />
      </div>
    )
  }
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
      reportItem: Reports.findOne({ id: parseInt(reportId) })
    }
  }, ReportPreview)
)
