import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import { Route, Redirect, Switch } from 'react-router-dom'
import routerRedux from 'react-router-redux'
import { Meteor } from 'meteor/meteor'
import _ from 'lodash'
import Cases from '../../api/cases'
import Comments from '../../api/comments'
import Preloader from '../preloader/preloader'
import actions from './case.actions'
import MaximizedAttachment from './maximized-attachment'
import CaseMessages from './case-messages'
import { attachmentTextMatcher } from '../../util/matchers'

export class Case extends Component {
  render () {
    const {
      caseItem, comments, loadingCase, loadingComments, caseError, attachmentUploads, match, userEmail, dispatch
    } = this.props
    if (caseError) return <h1>{caseError.error.message}</h1>
    if (loadingCase || loadingComments) return <Preloader />
    const { goBack, push } = routerRedux
    const { createComment, createAttachment, retryAttachment } = actions
    const { caseId } = match.params

    return (
      <Switch>
        <Route exact path={match.url} render={() => (
          <CaseMessages
            caseItem={caseItem} comments={comments} attachmentUploads={attachmentUploads} userEmail={userEmail}
            onCreateComment={text => dispatch(createComment(text, caseId))}
            onCreateAttachment={(preview, file) => dispatch(createAttachment(preview, file, caseId))}
            onRetryAttachment={process => dispatch(retryAttachment(process))}
            onThumbClicked={id => dispatch(push(`${match.url}/attachment/${id}`))} />
        )} />
        <Route exact path={`${match.url}/attachment/:attachId`} render={subProps => {
          const { attachId } = subProps.match.params
          const selectedComment = _.find(comments, {id: parseInt(attachId)})
          if (!selectedComment || !attachmentTextMatcher(selectedComment.text)) {
            return <Redirect to={match.url} />
          } else {
            const { text, creator } = selectedComment
            const attachmentUrl = text.split('\n')[1]
            const creatorText = userEmail === creator ? 'You' : creator
            return <MaximizedAttachment
              creatorText={creatorText} attachmentUrl={attachmentUrl} creationTime={selectedComment.creation_time}
              onBack={() => this.props.dispatch(goBack())} />
          }
        }} />
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
  attachmentUploads: PropTypes.array
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

function mapStateToProps ({caseAttachmentUploads}, props) {
  return {
    attachmentUploads: caseAttachmentUploads[props.match.params.caseId.toString()] || []
  }
}

export default connect(mapStateToProps)(CaseContainer)
