import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import { goBack, replace, push } from 'react-router-redux'
import moment from 'moment'
import CircularProgress from 'material-ui/CircularProgress'
import FontIcon from 'material-ui/FontIcon'
import FlatButton from 'material-ui/FlatButton'
import { parseQueryString } from '../../util/parsers'
import Units, { collectionName, getUnitRoles } from '../../api/units'
import InnerAppBar from '../components/inner-app-bar'
import EditableItem from '../components/editable-item'
import Preloader from '../preloader/preloader'
import { infoItemMembers, infoItemLabel } from '../util/static-info-rendering'
import { userInfoItem } from '../../util/user'
import { makeMatchingUser } from '../../api/custom-users'

const CreatorWrapperInt = props => {
  const { userIdentity, loading, loadingUser } = props
  if (loadingUser) return <CircularProgress size={30} thickness={3} />
  return (
    <div className='relative'>
      <div className={loading ? 'o-60' : ''}>{userInfoItem(userIdentity)}</div>
      {loading && (
        <div className='absolute top-0 bottom-0 right-0 left-0 flex justify-center items-center'>
          <CircularProgress size={30} thickness={3} />
        </div>
      )}
    </div>
  )
}

CreatorWrapperInt.propTypes = {
  unitId: PropTypes.string,
  userIdentity: PropTypes.object,
  loading: PropTypes.bool.isRequired,
  loadingUser: PropTypes.bool.isRequired
}

const CreatorWrapper = createContainer(props => {
  const { unitId } = props
  const bzLoginHandle = Meteor.subscribe('users.myBzLogin')
  if (!bzLoginHandle.ready()) {
    return {
      loading: true,
      loadingUser: true
    }
  }
  const currUser = Meteor.user()

  const rolelessIdentity = makeMatchingUser({
    login: currUser.bugzillaCreds.login,
    role: ' '
  })
  if (unitId) {
    const unitHandle = Meteor.subscribe(`${collectionName}.byIdWithUsers`, unitId)

    let userIdentity
    if (unitHandle.ready() && currUser) {
      const userRoleDesc = getUnitRoles(Units.findOne({id: parseInt(unitId)}))
        .find(desc => desc.login === currUser.bugzillaCreds.login)
      userIdentity = makeMatchingUser(userRoleDesc)
    } else {
      userIdentity = rolelessIdentity
    }
    return {
      loading: !unitHandle.ready(),
      userIdentity: userIdentity,
      loadingUser: false
    }
  } else {
    return {
      loading: false,
      userIdentity: rolelessIdentity,
      loadingUser: false
    }
  }
}, CreatorWrapperInt)

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

class ReportWizard extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      selectedUnit: null,
      reportTitle: null,
      initDone: false
    }
  }
  componentWillReceiveProps (nextProps) {
    if (nextProps.preferredUnitId && !nextProps.loadingUnits && !this.state.initDone) {
      this.setState({
        selectedUnit: nextProps.unitList.find(u => u.id === parseInt(nextProps.preferredUnitId)).name,
        initDone: true
      })
    }
  }
  componentDidUpdate (prevProps, prevState) {
    const { dispatch, match, unitList } = this.props
    const { selectedUnit } = this.state
    if (prevState.selectedUnit !== selectedUnit) {
      const unitId = unitList.find(unit => unit.name === selectedUnit).id
      dispatch(replace(`${match.url}?unit=${unitId}`))
    }
  }
  render () {
    const { unitList, loadingUnits, dispatch } = this.props
    const { selectedUnit, reportTitle } = this.state

    if (loadingUnits) {
      return <Preloader />
    }
    const unitId = selectedUnit ? unitList.find(u => u.name === selectedUnit).id.toString() : null

    return (
      <div className='full-height flex flex-column'>
        <InnerAppBar onBack={() => dispatch(goBack())} title='Create Report' />
        <div className='flex-grow bg-very-light-gray overflow-auto'>
          <div className='bg-white card-shadow-1 ph3 pb3'>
            <EditableItem
              label='Unit *'
              onEdit={val => this.setState({selectedUnit: val})}
              selectionList={unitList.map(u => u.name)}
              initialValue={selectedUnit}
            />
            <EditableItem
              label='Report title *'
              onEdit={val => this.setState({reportTitle: val})}
              initialValue={reportTitle}
            />
            <div className='pt1'>
              {infoItemMembers('Created on', moment().format('DD/MM/YYYY'))}
            </div>
            <div className='mt2 pt1'>
              {infoItemLabel('Created by')}
              <CreatorWrapper unitId={unitId} />
            </div>
          </div>
          <div className='bg-white card-shadow-1 ph3 pv2 mt2'>
            <div className='b dark-gray lh-copy'>
              Would you like to report any issue with the unit?
            </div>
            {makeCreationButton('Add case', () => dispatch(push(`/case/new?unit=${unitId}`)))}
          </div>
          <div className='bg-white card-shadow-1 ph3 pv2 mt2'>
            {infoItemLabel('Rooms')}
            <div className='moon-gray f7 mt2'>
              There are no rooms added to this Inspection Report yet. Click
              Add room to begin.
            </div>
            {makeCreationButton('Add room', () => {})}
          </div>
        </div>
      </div>
    )
  }
}

ReportWizard.propTypes = {
  loadingUnits: PropTypes.bool.isRequired,
  unitList: PropTypes.array.isRequired,
  preferredUnitId: PropTypes.string,
  user: PropTypes.object
}

export default connect(
  (state, props) => {
    const { unit } = parseQueryString(props.location.search)
    return {
      preferredUnitId: unit
    }
  }
)(
  createContainer(() => {
    return {
      loadingUnits: !Meteor.subscribe(`${collectionName}.forReporting`).ready(),
      unitList: Units.find().fetch(),
      user: Meteor.user()
    }
  }, ReportWizard)
)
