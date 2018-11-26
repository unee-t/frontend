// @flow
/* global File */
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
import ErrorDialog from '../dialogs/error-dialog'
import Preloader from '../preloader/preloader'
import { generateHTMLPreview } from './report-preview.actions'
import {
  changeReportsLogo,
  dismissChangeLogoError,
  resetReportsLogo
} from '/imports/state/actions/report-settings.actions'

import ConfirmationDialog from '../dialogs/confirmation-dialog'

type Props = {
  isLoading: boolean,
  previewIsLoading: boolean,
  isUploadingLogo: boolean,
  uploadingLogoPercent?: number,
  uploadingLogoError?: { error?: string },
  reportItem: any,
  match: any,
  dispatch: (action: any) => void,
  previewUrl: string,
  premiumEnabled: boolean,
  customLogoExists: boolean
}

type State = {
  showLogoAction: boolean,
  showChangeLogoDialog: boolean,
  logoMarkingVisible: boolean,
  showConfirmReset: boolean
}

const logoActionStyles = 'bg-black-70 br2 white pa2 lh-title f6 b flex items-center'

class ReportPreview extends React.Component<Props, State> {
  state = {
    showLogoAction: false,
    showChangeLogoDialog: false,
    logoMarkingVisible: true,
    showConfirmReset: false
  }

  componentDidMount () {
    const { match, dispatch } = this.props
    dispatch(generateHTMLPreview(match.params.reportId))
  }
  componentDidUpdate (prevProps: Props) {
    const { uploadingLogoError, isUploadingLogo, match, dispatch, customLogoExists } = this.props

    // Reloading a new preview if it is just after uploading a new logo
    if (
      (prevProps.isUploadingLogo && !isUploadingLogo && !uploadingLogoError) ||
      (prevProps.customLogoExists && !customLogoExists)
    ) {
      dispatch(generateHTMLPreview(match.params.reportId))
    }
  }

  handleIframeLoad = evt => {
    const iframeDoc = evt.target.contentDocument
    if (!iframeDoc) return console.warn('Report\'s content loaded from different domain, the dashed rect will be buggy')
    iframeDoc.addEventListener('scroll', () => {
      const { logoMarkingVisible } = this.state

      if (logoMarkingVisible && iframeDoc.scrollingElement.scrollTop !== 0) {
        this.setState({
          logoMarkingVisible: false,
          showLogoAction: false
        })
      } else if (iframeDoc.scrollingElement.scrollTop === 0) {
        this.setState({
          logoMarkingVisible: true
        })
      }
    })
    iframeDoc.addEventListener('click', () => {
      this.setState({
        showLogoAction: false
      })
    })
  }

  render () {
    const {
      isLoading, reportItem, dispatch, previewIsLoading, previewUrl, premiumEnabled, customLogoExists,
      isUploadingLogo, uploadingLogoError, uploadingLogoPercent
    } = this.props
    const { showLogoAction, showChangeLogoDialog, logoMarkingVisible, showConfirmReset } = this.state
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
            <div className='flex-grow relative'>
              <div className='absolute top-0 bottom-0 right-0 left-0'>
                <iframe className='bn w-100 h-100' src={previewUrl} onLoad={this.handleIframeLoad} />
              </div>
              {isDraft && premiumEnabled && logoMarkingVisible && (
                <div className='absolute left-0 top-0 flex flex-column pl1 pt1'>
                  <div
                    className={'ba b--mid-gray b--dashed br2 bw1 w-content' + (isUploadingLogo ? ' bg-white-60' : '')}
                    onClick={() => {
                      !isUploadingLogo && this.setState({
                        showLogoAction: !showLogoAction
                      })
                    }}
                  >
                    <div className='h3 w2 mh2 flex items-center justify-center'>
                      {isUploadingLogo && (uploadingLogoPercent ? (
                        <CircularProgress
                          size={30} thickness={4} mode='determinate' value={uploadingLogoPercent} />
                      ) : (
                        <div className='dib'>
                          <CircularProgress
                            size={30} thickness={4} mode='indeterminate' />
                        </div>
                      ))}
                    </div>
                  </div>
                  {showLogoAction && (
                    <div className='flex mt1'>
                      <div
                        className={logoActionStyles}
                        onClick={() => this.setState({ showChangeLogoDialog: true })}
                      >
                        <FontIcon className='material-icons' color='#fff'>camera_alt</FontIcon>
                        <div className='ml1'>
                          Customize
                        </div>
                      </div>
                      {customLogoExists && (
                        <div
                          className={'ml1 ' + logoActionStyles}
                          onClick={() => this.setState({ showConfirmReset: true })}
                        >
                          <FontIcon className='material-icons fliph-r-270' color='#fff'>refresh</FontIcon>
                          <div className='ml1'>
                            Reset to default
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
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
          onConfirm={(file: File) => {
            this.setState({
              showChangeLogoDialog: false,
              showLogoAction: false
            })
            dispatch(changeReportsLogo(file))
          }}
          onClose={() => this.setState({ showChangeLogoDialog: false })}
        />
        <ErrorDialog
          show={!!uploadingLogoError}
          text={uploadingLogoError ? uploadingLogoError.error : ''}
          onDismissed={() => dispatch(dismissChangeLogoError())}
        />
        <ConfirmationDialog
          show={showConfirmReset}
          title='Reset logo back to default'
          onConfirm={() => {
            this.setState({ showConfirmReset: false })
            dispatch(resetReportsLogo())
          }}
          onCancel={() => this.setState({ showConfirmReset: false })}
        >
          <h3 className='near-black pt3 ph2 fw3 lh-copy tc'>
            This will reset all the draft reports' logo back to the default "Unee-T" logo
          </h3>
        </ConfirmationDialog>
      </div>
    )
  }
}

export default connect(
  ({ reportPreviewUrls, logoChangingState }, props) => {
    const { reportId } = props.match.params
    const previewInfo = reportPreviewUrls[reportId.toString()]
    return {
      previewIsLoading: !!previewInfo && !!previewInfo.inProgress,
      previewUrl: previewInfo && previewInfo.url,
      isUploadingLogo: logoChangingState.inProgress,
      uploadingLogoPercent: logoChangingState.percent || 0,
      uploadingLogoError: logoChangingState.error
    }
  }
)(
  createContainer(props => {
    const { reportId } = props.match.params
    const reportHandle = Meteor.subscribe(`${collectionName}.byId`, reportId)
    const userHandle = Meteor.subscribe('users.myPremiumStatus')
    const currUser = Meteor.user()
    return {
      isLoading: !reportHandle.ready() || !userHandle.ready(),
      reportItem: Reports.findOne({ id: parseInt(reportId) }),
      premiumEnabled: !!currUser && currUser.customReportLogoEnabled,
      customLogoExists: !!currUser && !!currUser.customReportsLogoUrl
    }
  }, ReportPreview)
)
