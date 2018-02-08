import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import { Route, Redirect, Switch } from 'react-router-dom'
import routerRedux from 'react-router-redux'
import { Meteor } from 'meteor/meteor'
import _ from 'lodash'
import Cases, { getCaseUsers, collectionName as casesCollName } from '../../api/cases'
import Comments from '../../api/comments'
import Units, { getUnitRoles, collectionName as unitsCollName } from '../../api/units'
import PendingInvitations, { collectionName as inviteCollName } from '../../api/pending-invitations'
import Preloader from '../preloader/preloader'
import InnerAppBar from '../components/inner-app-bar'
import actions from './case.actions'
import MaximizedAttachment from './maximized-attachment'
import CaseMessages from './case-messages'
import CaseDetails from './case-details'
import { attachmentTextMatcher } from '../../util/matchers'

export class Case extends Component {
  navigateToAttachment (id) {
    const { push } = routerRedux
    this.props.dispatch(push(`${this.props.match.url}/attachment/${id}`))
  }

  handleBack (defaultPath) {
    const { push, goBack } = routerRedux
    if (this.props.location.action === 'PUSH') {
      this.props.dispatch(goBack())
    } else {
      this.props.dispatch(push(defaultPath || this.props.location.pathname.split('/').slice(0, -1).join('/')))
    }
  }

  render () {
    const {
      caseItem, comments, loadingCase, loadingComments, loadingUnit, caseError, commentsError, unitError, unitItem,
      attachmentUploads, match, userEmail, dispatch, unitUsers, invitationState, caseUserTypes,
      loadingPendingInvitations, pendingInvitations
    } = this.props
    if (caseError) return <h1>Error loading the case: {caseError.error.message}</h1>
    if (commentsError) return <h1>Error loading the comments: {commentsError.error.message}</h1>
    if (unitError) return <h1>Error loading the unit: {unitError.error.message}</h1>
    if (loadingCase || loadingComments || loadingUnit || loadingPendingInvitations) return <Preloader />

    const { push } = routerRedux
    const {
      createComment, createAttachment, retryAttachment, addRoleUser, removeRoleUser, inviteNewUser, clearInvitation
    } = actions
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
            const { text, creator } = selectedComment
            const attachmentUrl = text.split('\n')[1]
            const creatorText = userEmail === creator ? 'You' : creator
            return <MaximizedAttachment
              creatorText={creatorText} attachmentUrl={attachmentUrl} creationTime={selectedComment.creation_time}
              onBack={() => this.handleBack(match.url)} />
          }
        }} />
        <Route path={match.url} render={props => (
          <div className='flex flex-column full-height roboto overflow-hidden'>
            <InnerAppBar
              title={caseItem.summary} onBack={() => this.handleBack(props.match.isExact ? null : match.url)}
            />
            <Route exact path={match.url} render={() => (
              <CaseMessages
                {...{caseItem, comments, attachmentUploads, userEmail}}
                onCreateComment={text => dispatch(createComment(text, caseId))}
                onCreateAttachment={(preview, file) => dispatch(createAttachment(preview, file, caseId))}
                onRetryAttachment={process => dispatch(retryAttachment(process))}
                onThumbClicked={this.navigateToAttachment.bind(this)}
                onMoreInfo={() => dispatch(push(detailsUrl))}
              />
            )} />
            <Route path={detailsUrl} render={() => (
              <CaseDetails
                {...{caseItem, comments, unitUsers, invitationState, unitItem, caseUserTypes, pendingInvitations}}
                onRoleUserAdded={user => dispatch(addRoleUser(user.login, caseId))}
                onRoleUserRemoved={user => dispatch(removeRoleUser(user.login, caseId))}
                onNewUserInvited={
                  (email, role, isOccupant) => dispatch(inviteNewUser(email, role, isOccupant, caseId, unitItem.id))
                }
                onResetInvitation={() => dispatch(clearInvitation())}
                onSelectAttachment={this.navigateToAttachment.bind(this)}
              />
            )} />
          </div>
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
  loadingUnit: PropTypes.bool,
  unitError: PropTypes.object,
  unitItem: PropTypes.object,
  unitUsers: PropTypes.array,
  caseUserTypes: PropTypes.object,
  invitationState: PropTypes.object.isRequired,
  loadingPendingInvitations: PropTypes.bool.isRequired,
  pendingInvitations: PropTypes.array
}

let caseError, commentsError, unitError
const CaseContainer = createContainer(props => {
  const { caseId } = props.match.params
  const caseHandle = Meteor.subscribe(`${casesCollName}.byId`, caseId, {
    onStop: error => {
      caseError = error
    }
  })
  const commentsHandle = Meteor.subscribe('caseComments', caseId, {
    onStop: error => {
      commentsError = error
    }
  })
  const currCase = Cases.findOne(caseId)
  let currUnit, unitHandle
  if (currCase) {
    unitHandle = Meteor.subscribe(`${unitsCollName}.byId`, currCase.product, {
      onStop: error => {
        unitError = error
      }
    })
    currUnit = Units.findOne({name: currCase.product})
  }
  const caseUserTypes = currCase ? getCaseUsers(currCase) : null
  const unitRoles = currUnit && getUnitRoles(currUnit)
  const makeMatchingUser = bzUser => {
    const regUser = Meteor.users.findOne({'bugzillaCreds.login': bzUser.login})
    return regUser ? Object.assign({}, bzUser, regUser.profile) : bzUser
  }
  return {
    loadingCase: !caseHandle.ready(),
    caseError,
    caseItem: currCase,
    loadingComments: !commentsHandle.ready(),
    commentsError,
    comments: Comments.find({bug_id: parseInt(caseId)}).fetch(),
    userEmail: Meteor.user() ? Meteor.user().emails[0].address : null,
    loadingUnit: !unitHandle || !unitHandle.ready(),
    unitError,
    unitItem: currUnit,
    unitUsers: unitRoles && unitRoles.map(makeMatchingUser),
    caseUserTypes: caseUserTypes && unitRoles && Object.keys(caseUserTypes).reduce((all, userType) => {
      const mapUser = user => {
        const role = _.find(unitRoles, {login: user.login})
        const matchingUser = makeMatchingUser(user)
        return role ? Object.assign(matchingUser, {role: role.role}) : matchingUser
      }
      all[userType] = Array.isArray(caseUserTypes[userType])
        ? caseUserTypes[userType].map(mapUser)
        : mapUser(caseUserTypes[userType])
      return all
    }, {}),
    loadingPendingInvitations: !Meteor.subscribe(`${inviteCollName}.byCaseId`, parseInt(caseId)).ready(),
    pendingInvitations: PendingInvitations.find({caseId: parseInt(caseId)}).fetch()
  }
}, Case)

export default connect(
  ({caseAttachmentUploads, invitationState}, props) => ({
    attachmentUploads: caseAttachmentUploads[props.match.params.caseId.toString()] || [],
    invitationState
  })
)(CaseContainer)
