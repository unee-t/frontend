import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import { Route, Redirect, Switch, withRouter } from 'react-router-dom'
import routerRedux from 'react-router-redux'
import { Meteor } from 'meteor/meteor'
import _ from 'lodash'
import moment from 'moment'
import AppBar from 'material-ui/AppBar'
import IconButton from 'material-ui/IconButton'
import FontIcon from 'material-ui/FontIcon'
import Cases from '../../api/cases'
import Comments from '../../api/comments'
import actions from './case.actions'
import MaximizedAttachment from './maximized-attachment'
import CaseMessages from './case-messages'
import CaseDetails from './case-details'
import { attachmentTextMatcher } from '../../util/matchers'
import { formatDayText } from '../../util/formatters'

import {
  titleStyle
} from '../components/app-bar.mui-styles'

export class Case extends Component {
  componentWillReceiveProps ({caseItem, comments, loadingCase, loadingComments, caseError, dispatch, userEmail}) {
    if (!loadingCase && !loadingComments && !caseError &&
      (loadingCase !== this.props.loadingCase || loadingComments !== this.props.loadingComments)
    ) {
      this.props.dispatchLoadingResult({caseItem, comments, dispatch, userEmail})
    }
  }
  navigateToAttachment (id) {
    const { push } = routerRedux
    this.props.dispatch(push(`${this.props.match.url}/attachment/${id}`))
  }

  render () {
    const {
      caseItem, comments, loadingCase, loadingComments, caseError, attachmentUploads, match, userEmail, dispatch
    } = this.props
    if (caseError) return <h1>{caseError.error.message}</h1>
    if (loadingCase || loadingComments) return <span>Loading...</span>
    const { push } = routerRedux
    const { createComment, createAttachment, retryAttachment } = actions
    const { caseId } = match.params
    const detailsUrl = `${match.url}/details`

    return (
      <Switch>
        <Route exact path={`${match.url}/attachment/:attachId`} render={subProps => {
          const { attachId } = subProps.match.params
          const selectedComment = _.find(comments, {id: parseInt(attachId)})
          if (!selectedComment || !attachmentTextMatcher(selectedComment.text)) {
            return <Redirect to={match.url} />
          } else {
            const { text } = selectedComment
            const attachmentUrl = text.split('\n')[1]
            return <MaximizedAttachment attachmentUrl={attachmentUrl} />
          }
        }} />
        <Route path={match.url} render={props => (
          <Switch>
            <Route exact path={match.url} render={() => (
              <CaseMessages
                caseItem={caseItem} comments={comments} attachmentUploads={attachmentUploads} userEmail={userEmail}
                onCreateComment={text => dispatch(createComment(text, caseId))}
                onCreateAttachment={(preview, file) => dispatch(createAttachment(preview, file, caseId))}
                onRetryAttachment={process => dispatch(retryAttachment(process))}
                onThumbClicked={this.navigateToAttachment.bind(this)}
                onMoreInfo={() => dispatch(push(detailsUrl))}
              />
            )} />
            <Route exact path={detailsUrl} render={() => (
              <CaseDetails caseItem={caseItem} comments={comments}
                onSelectAttachment={this.navigateToAttachment.bind(this)}
              />
            )} />
          </Switch>
        )} />
        <Redirect to={match.url} />
      </Switch>
    )
  }
}

Case.propTypes = {
  loadingCase: PropTypes.bool,
  caseError: PropTypes.object,
  caseItem: PropTypes.object,
  loadingComments: PropTypes.bool,
  commentsError: PropTypes.object,
  comments: PropTypes.array,
  userEmail: PropTypes.string,
  attachmentUploads: PropTypes.array,
  dispatchLoadingResult: PropTypes.func.isRequired
}

let caseError, commentsError
const CaseContainer = createContainer(props => {
  const { caseId } = props.match.params
  const caseHandle = Meteor.subscribe('case', caseId, {
    onStop: (error) => {
      caseError = error
    }
  })
  const commentsHandle = Meteor.subscribe('caseComments', caseId, {
    onStop: (error) => {
      commentsError = error
    }
  })

  return {
    loadingCase: !caseHandle.ready(),
    caseError,
    caseItem: Cases.findOne(caseId),
    loadingComments: !commentsHandle.ready(),
    commentsError,
    comments: Comments.find({bug_id: parseInt(caseId)}).fetch(),
    userEmail: Meteor.user() ? Meteor.user().emails[0].address : null
  }
}, Case)

const connectedWrapper = withRouter(connect(
  ({caseAttachmentUploads}, props) => ({
    attachmentUploads: caseAttachmentUploads[props.match.params.caseId.toString()] || []
  })
)(CaseContainer))

const MobileHeader = props => {
  const { caseItem, comments, dispatch, userEmail } = props.contentProps
  const { match } = props
  const handleBack = defaultPath => {
    const { push, goBack } = routerRedux
    if (props.location.action === 'PUSH') {
      dispatch(goBack())
    } else {
      dispatch(push(defaultPath || props.location.pathname.split('/').slice(0, -1).join('/')))
    }
  }
  return (
    <Switch>
      <Route exact path={`${match.url}/attachment/:attachId`} render={subProps => {
        const { attachId } = subProps.match.params
        const selectedComment = _.find(comments, {id: parseInt(attachId)})
        const { creationTime, creator } = selectedComment
        const timeText = `${formatDayText(creationTime)}, ${moment(creationTime).format('HH:mm')}`
        const creatorText = userEmail === creator ? 'You' : creator
        return (
          <div className='fixed top-0 w-100 bg-black-20 flex items-center'>
            <IconButton onClick={() => handleBack(match.url)}>
              <FontIcon className='material-icons' color='white'>arrow_back</FontIcon>
            </IconButton>
            <div className='white'>
              <h4 className='mv1'>{creatorText}</h4>
              <h5 className='mv1'>{timeText}</h5>
            </div>
          </div>
        )
      }} />
      <Route path={match.url} render={routeProps => (
        <AppBar title={caseItem.summary}
          titleStyle={titleStyle}
          iconElementLeft={
            <IconButton onClick={() => handleBack(routeProps.match.isExact ? null : match.url)}>
              <FontIcon className='material-icons' color='white'>arrow_back</FontIcon>
            </IconButton>
          }
        />
      )} />
    </Switch>
  )
}

MobileHeader.propTypes = {
  contentProps: PropTypes.object
}

connectedWrapper.MobileHeader = withRouter(MobileHeader)

export default connectedWrapper
