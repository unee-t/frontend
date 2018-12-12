// @flow
import * as React from 'react'
import { Meteor } from 'meteor/meteor'
import { createContainer } from 'meteor/react-meteor-data'
import { connect } from 'react-redux'
import { goBack } from 'react-router-redux'
import CircularProgress from 'material-ui/CircularProgress'
import FloatingInfoBar from '../components/floating-info-bar'
import Comments, { collectionName as commentsCollName } from '/imports/api/comments'
import Reports, { collectionName as reportsCollName } from '/imports/api/reports'
import MaximizedAttachment from '../case/maximized-attachment'
import { formatDayText } from '../../util/formatters'
import moment from 'moment'
type Props = {
  dispatch: (action: any) => void,
  match: {
    params: {
      attachmentId: string,
      reportId: string
    }
  },
  isLoading: boolean,
  attachmentInfo: {
    creation_time: string,
    count: number,
    text: string
  },
  reportItem: {
    title: string
  }
}
class ReportAttachment extends React.Component<Props> {
  render () {
    const { dispatch, isLoading, attachmentInfo, reportItem } = this.props
    let timeText = ''
    let attachmentUrl = ''
    if (!isLoading) {
      timeText = `${formatDayText(attachmentInfo.creation_time)}, ${moment(attachmentInfo.creation_time).format('HH:mm')}`
      attachmentUrl = attachmentInfo.text.split('\n')[1]
    }
    return (
      <div className='bg-black full-height flex flex-column'>
        <FloatingInfoBar handleBack={() => dispatch(goBack())}>
          <div className='white'>
            <h4 className='mv1'>
              {isLoading ? 'Attachment...' : `Attachment #${attachmentInfo.count} for "${reportItem.title}"`}
            </h4>
            <h5 className='mv1'>
              {isLoading ? '...' : `Created at ${timeText}`}
            </h5>
          </div>
        </FloatingInfoBar>
        {isLoading ? (
          <div className='flex-grow flex items-center justify-center'>
            <CircularProgress thickness={5} size={70} />
          </div>
        ) : (
          <MaximizedAttachment attachmentUrl={attachmentUrl} />
        )}
      </div>
    )
  }
}
export default connect(
  () => ({}) // map redux state to props
)(createContainer(props => { // map meteor state to props
  const commentId = parseInt(props.match.params.attachmentId)
  const reportId = parseInt(props.match.params.reportId)
  const commentHandle = Meteor.subscribe(`${commentsCollName}.byId`, commentId)
  const reportHandle = Meteor.subscribe(`${reportsCollName}.byId`, reportId)
  return {
    isLoading: !commentHandle.ready() || !reportHandle.ready(),
    attachmentInfo: Comments.findOne({ id: commentId }),
    reportItem: Reports.findOne({ id: reportId })
  }
}, ReportAttachment))
