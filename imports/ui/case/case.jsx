import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import { Route, Redirect, Switch, withRouter } from 'react-router-dom'
import routerRedux from 'react-router-redux'
import { Meteor } from 'meteor/meteor'
import _ from 'lodash'
import moment from 'moment'
import Cases, { getCaseUsers, collectionName as casesCollName } from '../../api/cases'
import Comments, { collectionName as commentsCollName } from '../../api/comments'
import Units, { getUnitRoles, collectionName as unitsCollName } from '../../api/units'
import PendingInvitations, { collectionName as inviteCollName } from '../../api/pending-invitations'
import CaseFieldValues, { collectionName as cfvCollName } from '../../api/case-field-values'
import InnerAppBar from '../components/inner-app-bar'
import actions, { markNotificationsAsRead } from './case.actions'
import MaximizedAttachment from './maximized-attachment'
import CaseMessages from './case-messages'
import CaseDetails from './case-details'
import { attachmentTextMatcher } from '../../util/matchers'
// import WelcomeDialog from '../dialogs/welcome-dialog'
import { formatDayText } from '../../util/formatters'
import Preloader from '../preloader/preloader'
import { makeMatchingUser } from '../../api/custom-users'
import FloatingInfoBar from '../components/floating-info-bar'

export class Case extends Component {
  componentDidMount () {
    const { match, dispatch } = this.props
    const { caseId } = match.params
    dispatch(markNotificationsAsRead(caseId))
  }
  componentWillReceiveProps ({
    caseItem, comments, loadingCase, loadingComments, loadingUnit, loadingPendingInvitations, caseError, dispatch,
    userBzLogin, ancestorPath
  }) {
    if (!loadingCase && !loadingComments && !loadingUnit && !loadingPendingInvitations && !caseError &&
      (
        loadingCase !== this.props.loadingCase ||
        loadingComments !== this.props.loadingComments ||
        loadingUnit !== this.props.loadingUnit ||
        loadingPendingInvitations !== this.props.loadingPendingInvitations ||
        !_.isEqual(comments, this.props.comments)
      )
    ) {
      this.props.dispatchLoadingResult({ caseItem, comments, dispatch, userBzLogin, ancestorPath })
    }
  }
  navigateToAttachment (id) {
    const { push } = routerRedux
    this.props.dispatch(push(`${this.props.match.url}/attachment/${id}`))
  }

  render () {
    const {
      caseItem, comments, loadingCase, loadingComments, loadingUnit, caseError, commentsError, unitError, unitItem,
      attachmentUploads, match, userBzLogin, dispatch, unitUsers, invitationState, caseUserTypes,
      loadingPendingInvitations, pendingInvitations, /* showWelcomeDialog, invitedByDetails, */
      cfvDictionary, loadingCfv, cfvError, caseUsersState
    } = this.props
    const errors = [
      [caseError, 'case'], [commentsError, 'comments'], [unitError, 'unit'], [cfvError, 'potential field values']
    ].filter(pair => !!pair[0])
    if (errors.length) {
      return (
        <div>
          {errors.reduce((all, pair, i) => {
            const [e, name] = pair
            console.log('API error occurred', e.error.origError)

            return all.concat([
              <h1 key={i}>Error loading the {name}: {e.error.message}</h1>
            ])
          }, [])}
        </div>
      )
    }
    if (loadingCase || loadingComments || loadingUnit || loadingPendingInvitations || loadingCfv) return <Preloader />

    const { push } = routerRedux
    const {
      createComment, createAttachment, retryAttachment, addRoleUsers, removeRoleUser, inviteNewUser, clearInvitation,
      /* clearWelcomeMessage, updateInvitedUserName, */ assignNewUser, assignExistingUser, editCaseField, clearRoleUsersState
    } = actions
    const { caseId } = match.params
    const detailsUrl = `${match.url}/details`

    return (
      <Switch>
        <Route exact path={`${match.url}/attachment/:attachId`} render={subProps => {
          const { attachId } = subProps.match.params
          const selectedComment = _.find(comments, { id: parseInt(attachId) })
          if (!selectedComment || !attachmentTextMatcher(selectedComment.text)) {
            return <Redirect to={match.url} />
          } else {
            const { text } = selectedComment
            const attachmentUrl = text.split('\n')[1]
            return <MaximizedAttachment attachmentUrl={attachmentUrl} />
          }
        }} />
        <Route path={match.url} render={props => (
          <div className='flex-grow roboto overflow-hidden h-100'>
            <Switch>
              <Route exact path={match.url} render={() => (
                <CaseMessages
                  {...{ caseItem, comments, attachmentUploads, userBzLogin }}
                  onCreateComment={text => dispatch(createComment(text, caseId))}
                  onCreateAttachment={(preview, file) => dispatch(createAttachment(preview, file, caseId))}
                  onRetryAttachment={process => dispatch(retryAttachment(process))}
                  onThumbClicked={this.navigateToAttachment.bind(this)}
                  onMoreInfo={() => dispatch(push(detailsUrl))}
                />
              )} />
              <Route path={detailsUrl} render={() => (
                <CaseDetails
                  {...{
                    caseItem,
                    comments,
                    unitUsers,
                    invitationState,
                    unitItem,
                    caseUserTypes,
                    pendingInvitations,
                    cfvDictionary,
                    caseUsersState
                  }}
                  onRoleUsersInvited={userLogins => dispatch(addRoleUsers(userLogins, caseId))}
                  onRoleUserRemoved={user => dispatch(removeRoleUser(user.login, caseId))}
                  onNewUserInvited={
                    (email, role, isOccupant) => dispatch(inviteNewUser(email, role, isOccupant, caseId, unitItem.id))
                  }
                  onNewUserAssigned={
                    (email, role, isOccupant) => dispatch(assignNewUser(email, role, isOccupant, caseId, unitItem.id))
                  }
                  onExistingUserAssigned={user => dispatch(assignExistingUser(user, caseId))}
                  onResetInvitation={() => dispatch(clearInvitation())}
                  onSelectAttachment={this.navigateToAttachment.bind(this)}
                  onFieldEdit={changeSet => dispatch(editCaseField(changeSet, caseId))}
                  onClearRoleUsersState={() => dispatch(clearRoleUsersState())}
                />
              )} />
            </Switch>
            {/* <WelcomeDialog */}
            {/* show={showWelcomeDialog}* /}
            {/* onDismissed={() => dispatch(clearWelcomeMessage())}* /}
            {/* onNameSubmitted={name => dispatch(updateInvitedUserName(name))} */}
            {/* {...{ unitItem, caseItem, invitedByDetails }}* /}
            {/* /> */}
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
  userBzLogin: PropTypes.string,
  dispatchLoadingResult: PropTypes.func.isRequired,
  attachmentUploads: PropTypes.array,
  loadingUnit: PropTypes.bool,
  unitError: PropTypes.object,
  unitItem: PropTypes.object,
  loadingCfv: PropTypes.bool,
  cfvDictionary: PropTypes.object,
  cfvError: PropTypes.object,
  unitUsers: PropTypes.array,
  caseUserTypes: PropTypes.object,
  invitationState: PropTypes.object.isRequired,
  loadingPendingInvitations: PropTypes.bool.isRequired,
  pendingInvitations: PropTypes.array,
  // showWelcomeDialog: PropTypes.bool,
  // invitedByDetails: PropTypes.object,
  caseUsersState: PropTypes.object.isRequired,
  ancestorPath: PropTypes.string
}

let caseError, commentsError, unitError, cfvError
const CaseContainer = createContainer(props => {
  const { caseId } = props.match.params

  const caseHandle = Meteor.subscribe(`${casesCollName}.byId`, caseId, {
    onStop: error => {
      caseError = error
    }
  })
  const commentsHandle = Meteor.subscribe(`${commentsCollName}.byCaseId`, caseId, {
    onStop: error => {
      commentsError = error
    }
  })
  const currCase = caseHandle.ready() ? Cases.findOne(caseId) : null
  let currUnit, unitHandle
  if (currCase) {
    unitHandle = Meteor.subscribe(`${unitsCollName}.byNameWithUsers`, currCase.selectedUnit, {
      onStop: error => {
        unitError = error
      }
    })
    currUnit = unitHandle.ready() ? Units.findOne({ name: currCase.selectedUnit }) : null
  }
  const cfvHandle = Meteor.subscribe(`${cfvCollName}.fetchByName`, 'status', {
    onStop: error => {
      cfvError = error
    }
  })

  const bzLoginHandle = Meteor.subscribe('users.myBzLogin')

  const caseUserTypes = currCase ? getCaseUsers(currCase) : null
  const unitRoles = currUnit && getUnitRoles(currUnit)
  return {
    loadingCase: !caseHandle.ready(),
    caseError,
    caseItem: currCase,
    loadingComments: !commentsHandle.ready(),
    commentsError,
    comments: Comments.find({ bug_id: parseInt(caseId) }).fetch().map(comment => {
      const creatorUser = Meteor.users.findOne({ 'bugzillaCreds.login': comment.creator })
      return { ...comment, creatorUser }
    }),
    userBzLogin: bzLoginHandle.ready() ? Meteor.user().bugzillaCreds.login : null,
    loadingUnit: !unitHandle || !unitHandle.ready(),
    unitError,
    unitItem: currUnit,
    unitUsers: unitRoles && unitRoles.map(makeMatchingUser),
    caseUserTypes: caseUserTypes && unitRoles && Object.keys(caseUserTypes).reduce((all, userType) => {
      const mapUser = user => {
        const role = _.find(unitRoles, { login: user.login })
        const matchingUser = makeMatchingUser(user)
        return role ? Object.assign(matchingUser, { role: role.role }) : matchingUser
      }
      all[userType] = Array.isArray(caseUserTypes[userType])
        ? caseUserTypes[userType].map(mapUser)
        : mapUser(caseUserTypes[userType])
      return all
    }, {}),
    loadingCfv: !cfvHandle.ready(),
    cfvDictionary: cfvHandle.ready() ? { status: CaseFieldValues.findOne({ name: 'status' }) } : null,
    cfvError,
    loadingPendingInvitations: !Meteor.subscribe(`${inviteCollName}.byCaseId`, parseInt(caseId)).ready(),
    pendingInvitations: PendingInvitations.find({ caseId: parseInt(caseId) }).fetch().filter(inv => inv.inviteeUser())
  }
}, Case)

const connectedWrapper = withRouter(connect(
  (
    {
      attachmentUploads,
      invitationState,
      // invitationLoginState: { showWelcomeMessage, invitedByDetails },
      caseUsersState
    },
    props
  ) => ({
    attachmentUploads: attachmentUploads[props.match.params.caseId.toString()] || [],
    invitationState,
    caseUsersState
    // invitedByDetails,
    // showWelcomeDialog: !!showWelcomeMessage
  })
)(CaseContainer))

const MobileHeader = props => {
  const { caseItem, comments, dispatch, userBzLogin } = props.contentProps
  const { match } = props
  const handleBack = () => {
    dispatch(routerRedux.goBack())
  }
  return (
    <Switch>
      <Route exact path={`${match.url}/attachment/:attachId`} render={subProps => {
        const { attachId } = subProps.match.params
        const selectedComment = _.find(comments, { id: parseInt(attachId) })
        const { creation_time: creationTime, creator } = selectedComment
        const timeText = `${formatDayText(creationTime)}, ${moment(creationTime).format('HH:mm')}`
        const creatorText = userBzLogin === creator ? 'You' : creator
        return (
          <FloatingInfoBar handleBack={() => handleBack()}>
            <div className='white'>
              <h4 className='mv1'>{creatorText}</h4>
              <h5 className='mv1'>{timeText}</h5>
            </div>
          </FloatingInfoBar>
        )
      }} />
      <Route path={match.url} render={routeProps => (
        <InnerAppBar
          title={caseItem.title} onBack={() => handleBack()}
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
