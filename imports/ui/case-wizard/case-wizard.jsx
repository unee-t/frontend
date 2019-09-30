import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import { goBack } from 'react-router-redux'
import { withRouter } from 'react-router-dom'
import TextField from 'material-ui/TextField'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'
import RaisedButton from 'material-ui/RaisedButton'
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton'
import CircularProgress from 'material-ui/CircularProgress'
import CaseFieldValues, { collectionName as fieldValsCollName } from '../../api/case-field-values'
import Reports, { collectionName as reportsCollName } from '../../api/reports'
import UnitMetaData from '../../api/unit-meta-data'
import UnitRolesData from '../../api/unit-roles-data'
import Checkbox from 'material-ui/Checkbox'
import { parseQueryString } from '../../util/parsers'
import InnerAppBar from '../components/inner-app-bar'
import ErrorDialog from '../dialogs/error-dialog'
import Preloader from '../preloader/preloader'
import Units, { collectionName as unitsCollName } from '../../api/units'
import { createCase, clearError } from './case-wizard.actions'
import { roleCanBeOccupantMatcher } from '../../util/matchers'
import { emailValidator } from '../../util/validators'
import InputRow from '../components/input-row'
import { infoItemMembers } from '../util/static-info-rendering'

import {
  textInputFloatingLabelStyle,
  textInputStyle,
  textInputUnderlineFocusStyle,
  selectInputIconStyle,
  controlLabelStyle
} from '../components/form-controls.mui-styles'
import { MarkerIcon } from '../components/generic-icons'
import FloorPlanEditor from '../components/floor-plan-editor'
import FloorPlanUploader from '../components/floor-plan-uploader'

class CaseWizard extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      inputValues: {
        mandatory: {
          title: '',
          assignedUnitRole: null
        },
        optional: {
          details: '',
          category: null,
          subCategory: null,
          assignee: null
        }
      },
      needsNewUser: false,
      newUserEmail: '',
      newUserCanBeOccupant: false,
      newUserIsOccupant: false,
      initDone: false,
      selectedRole: null,
      floorPlanPins: []
    }
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevState.needsNewUser !== this.state.needsNewUser && this.state.needsNewUser) {
      this.refs.scrollPane.scrollTop = this.refs.scrollPane.scrollHeight
      this.emailInputEl.focus()
    }
    const { availableRoles, userBzLogin } = this.props
    const { inputValues } = this.state
    if (availableRoles.length && !prevProps.availableRoles.length) {
      const defaultRole = availableRoles.find(roleObj => roleObj.assignedToYou).type

      this.setState({
        inputValues: Object.assign({}, inputValues, {
          mandatory: Object.assign({}, inputValues.mandatory, {
            assignedUnitRole: defaultRole
          }),
          optional: Object.assign({}, inputValues.optional, {
            assignee: userBzLogin
          })
        }),
        selectedRole: 'myself'
      })
    }
  }

  renderRadioButtons = () => {
    const { inProgress } = this.props
    return this.filterRolesBasedOnOwnership().map(({ type }) => (
      <RadioButton
        key={type} value={type} label={type} disabled={inProgress}
      />
    ))
  }

  handleRoleChanged = (evt, val) => {
    const { inputValues } = this.state
    const { userBzLogin } = this.props

    if (val === 'myself') {
      const myRole = this.props.availableRoles.find(role => role.assignedToYou)
      this.setState({
        inputValues: Object.assign({}, inputValues, {
          mandatory: Object.assign({}, inputValues.mandatory, {
            assignedUnitRole: myRole.type
          }),
          optional: Object.assign({}, inputValues.optional, {
            assignee: userBzLogin
          })
        }),
        needsNewUser: false,
        selectedRole: 'myself'
      })
    } else {
      const needsNewUser = !this.props.availableRoles.find(role => role.type === val).hasDefaultAssignee

      this.setState({
        inputValues: Object.assign({}, inputValues, {
          mandatory: Object.assign({}, inputValues.mandatory, {
            assignedUnitRole: val
          }),
          optional: Object.assign({}, inputValues.optional, {
            assignee: null
          })
        }),
        needsNewUser,
        newUserCanBeOccupant: roleCanBeOccupantMatcher(val),
        newUserIsOccupant: false,
        selectedRole: val
      })
    }
  }

  handleSubmit = evt => {
    evt.preventDefault()
    if (!this.checkFormInvalid()) {
      const { inputValues: { mandatory, optional }, newUserEmail, newUserIsOccupant, floorPlanPins } = this.state
      if (optional.details === '') {
        optional.details = mandatory.title
      }
      if (floorPlanPins.length) {
        optional.floorPlanPins = floorPlanPins.map(({ x, y }) => ({ x, y }))
      }
      this.props.dispatch(createCase(
        Object.assign(
          {},
          Object.assign({ selectedUnit: this.props.unitItem.name }, mandatory),
          optional
        ),
        newUserEmail,
        newUserIsOccupant,
        this.props.reportItem
      ))
    }
  }

  checkFormInvalid = () => {
    const { inputValues: { mandatory }, needsNewUser, newUserEmail } = this.state
    return (
      (Object.keys(mandatory).filter(fieldName => !mandatory[fieldName]).length > 0) ||
      this.props.inProgress ||
      (needsNewUser && !emailValidator(newUserEmail))
    )
  }

  filterRolesBasedOnOwnership = () => {
    let filteredRoles
    const { unitItem, userId, availableRoles } = this.props
    if (unitItem.ownerIds && unitItem.ownerIds.includes(userId)) {
      filteredRoles = availableRoles
    } else {
      // A non-owner is not allowed to assign the contractor in any case, and can't assign to empty roles.
      // The last bool is used in case of no default assignee, but role is assigned to user (not sure if it's possible)
      filteredRoles = availableRoles.filter(role => role.type !== 'Contractor' && (role.hasDefaultAssignee || role.assignedToYou))
    }
    return filteredRoles
  }

  getActiveFloorPlan () {
    const { unitItem } = this.props
    if (unitItem.floorPlanUrls) {
      const lastPlanUrl = unitItem.floorPlanUrls.slice(-1)[0]
      if (!lastPlanUrl.disabled) {
        return lastPlanUrl
      }
    }
  }

  render () {
    const { isLoading, fieldValues, unitItem, dispatch, error, inProgress, reportItem } = this.props
    if (isLoading) {
      return <Preloader />
    }
    const { inputValues, needsNewUser, newUserEmail, newUserIsOccupant, newUserCanBeOccupant, selectedRole, floorPlanPins } = this.state
    const { mandatory, optional } = inputValues
    const { title, details, assignedUnitRole } = mandatory
    const { category, subCategory } = optional

    const rolesToRender = this.filterRolesBasedOnOwnership()

    const activeFloorPlan = this.getActiveFloorPlan()
    return (
      <div className='full-height flex flex-column'>
        <InnerAppBar title='New Case' onBack={() => dispatch(goBack())} />
        <form onSubmit={this.handleSubmit}>
          <div className='overflow-auto flex-grow pa3' ref='scrollPane'>
            {infoItemMembers('Unit', unitItem.displayName || unitItem.name)}
            {reportItem && (
              <div className='mt2 pt1'>
                {infoItemMembers('Report', reportItem.title)}
              </div>
            )}
            <TextField
              floatingLabelText='Case title *'
              floatingLabelShrinkStyle={textInputFloatingLabelStyle}
              underlineFocusStyle={textInputUnderlineFocusStyle}
              inputStyle={textInputStyle}
              fullWidth
              disabled={inProgress}
              value={title}
              onChange={evt => this.setState({
                inputValues: Object.assign({}, inputValues, {
                  mandatory: Object.assign({}, mandatory, {
                    title: evt.target.value
                  })
                })
              })}
            />
            <TextField
              floatingLabelText='Details'
              floatingLabelShrinkStyle={textInputFloatingLabelStyle}
              underlineFocusStyle={textInputUnderlineFocusStyle}
              textareaStyle={textInputStyle}
              multiLine
              rowsMax={3}
              fullWidth
              disabled={inProgress}
              value={details}
              onChange={evt => this.setState({
                inputValues: Object.assign({}, inputValues, {
                  optional: Object.assign({}, optional, {
                    details: evt.target.value
                  })
                })
              })}
            />
            <div className='flex'>
              <div className='flex-grow mr2'>
                <SelectField
                  floatingLabelText='Category'
                  fullWidth
                  floatingLabelShrinkStyle={textInputFloatingLabelStyle}
                  labelStyle={textInputStyle}
                  menuStyle={textInputStyle}
                  iconStyle={selectInputIconStyle}
                  underlineFocusStyle={textInputUnderlineFocusStyle}
                  disabled={inProgress}
                  value={category}
                  onChange={(evt, idx, val) => val !== category && this.setState({
                    inputValues: Object.assign({}, inputValues, {
                      optional: Object.assign({}, optional, {
                        category: val,
                        subCategory: null
                      })
                    })
                  })}
                >
                  {fieldValues.category.values.map(({ name }) => (
                    <MenuItem key={name} value={name} primaryText={name} />
                  ))}
                </SelectField>
              </div>
              <div className='flex-grow ml2'>
                <SelectField
                  floatingLabelText='Sub-category'
                  fullWidth
                  floatingLabelShrinkStyle={textInputFloatingLabelStyle}
                  labelStyle={textInputStyle}
                  menuStyle={textInputStyle}
                  iconStyle={selectInputIconStyle}
                  underlineFocusStyle={textInputUnderlineFocusStyle}
                  disabled={!category || inProgress}
                  value={subCategory}
                  onChange={(evt, idx, val) => this.setState({
                    inputValues: Object.assign({}, inputValues, {
                      optional: Object.assign({}, optional, {
                        subCategory: val
                      })
                    })
                  })}
                >
                  {fieldValues.subCategory.values.reduce((all, { name, visibility_values: [relatedCategory] }) => {
                    if (relatedCategory === category || !relatedCategory) {
                      all.push(
                        <MenuItem key={name} value={name} primaryText={name} />
                      )
                    }
                    return all
                  }, [])}
                </SelectField>
              </div>
            </div>
            <div className='mt1'>
              <div className='flex items-center'>
                <MarkerIcon style={{ width: '12px', height: '17px' }} fillColor='var(--bondi-blue)' />
                <div className='ml2 f6 b bondi-blue'>Pin on Floor plan</div>
              </div>
              <div className='mt3'>
                <FloorPlanUploader unitMetaData={unitItem}>
                  <div>
                    <div className='w-100 ba b--gray-93'>
                      <FloorPlanEditor
                        pins={floorPlanPins}
                        floorPlan={activeFloorPlan}
                        onPinsChanged={pins => this.setState({ floorPlanPins: pins })}
                        isEditing
                        isMovable
                      />
                    </div>
                    <div className='mt2 f7 gray lh-copy'>
                      <span className='b'>Double tap</span> on the floorplan to specify the location in the unit. Swipe to pan. Pinch or spread with two fingers to zoom. Tap an existing marker to remove it.
                    </div>
                  </div>
                </FloorPlanUploader>
              </div>
            </div>

            {rolesToRender.length === 1 && rolesToRender[0].areYouDefAssignee ? (
              <p className='f7 gray ma0 mt2'>
                This case will be assigned to you as the {rolesToRender[0].type} of this unit
              </p>
            ) : rolesToRender.length === 0 ? (
              <p className='f7 gray ma0 mt2'>
                This case can't be created as you aren't allowed to assign anyone to it
              </p>
            ) : (
              <div>
                <p className='mt2 pv0 f6 bondi-blue'>Assign this case to:</p>
                <RadioButtonGroup
                  name='selectedRole'
                  onChange={this.handleRoleChanged}
                  valueSelected={selectedRole}
                >
                  <RadioButton
                    value='myself' label='Myself' disabled={inProgress}
                  />
                </RadioButtonGroup>
                <p className='pv0 f6 bondi-blue'>
                  <span className='b'>OR </span>
                  Assign this case to:
                </p>
                <RadioButtonGroup
                  name='selectedRole'
                  onChange={this.handleRoleChanged}
                  valueSelected={selectedRole}
                >
                  {this.renderRadioButtons()}
                </RadioButtonGroup>
              </div>
            )}
            {needsNewUser && (
              <div className='mt3'>
                <p className='mv0 pv0 f7 warn-crimson lh-copy'>
                  There is no one in the role of {assignedUnitRole} for this unit yet. Invite a new user to fill
                  the {assignedUnitRole} role or select a different role.
                </p>
                <InputRow label={`Email of the ${assignedUnitRole} to invite *`} value={newUserEmail} inpType='email'
                  onChange={(evt, val) => this.setState({ newUserEmail: val })}
                  errorText={(newUserEmail && !emailValidator(newUserEmail)) ? 'Email address is invalid' : ''}
                  inpRef={el => { this.emailInputEl = el }}
                  disabled={inProgress}
                />
                {newUserCanBeOccupant && (
                  <Checkbox
                    label={`This ${assignedUnitRole} is also the occupant of this unit`}
                    labelStyle={controlLabelStyle}
                    checked={newUserIsOccupant}
                    onCheck={(evt, isChecked) => { this.setState({ newUserIsOccupant: isChecked }) }}
                    disabled={inProgress}
                  />
                )}
              </div>
            )}
          </div>
          <div className='ph3 pb3'>
            <RaisedButton
              fullWidth backgroundColor='var(--bondi-blue)'
              disabled={this.checkFormInvalid()}
              type='submit'
            >
              {inProgress ? (
                <div className='absolute top-0 right-0 bottom-0 left-0'>
                  <CircularProgress color='white' size={30} />
                </div>
              ) : (
                <span className='white f4 b'>
                Add Case
                </span>
              )}
            </RaisedButton>
          </div>
        </form>
        <ErrorDialog show={!!error} text={error || ''} onDismissed={() => dispatch(clearError())} />
      </div>
    )
  }
}

CaseWizard.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  inProgress: PropTypes.bool.isRequired,
  error: PropTypes.string,
  unitItem: PropTypes.object,
  userBzLogin: PropTypes.string,
  fieldValues: PropTypes.object,
  preferredUnitId: PropTypes.string,
  reportItem: PropTypes.object,
  userId: PropTypes.string,
  availableRoles: PropTypes.array,
  floorPlanUploadProcess: PropTypes.object
}

export default withRouter(connect(
  ({ caseCreationState: { inProgress, error }, unitFloorPlanUploadState }, props) => {
    const { unit } = parseQueryString(props.location.search)
    const { unit: unitId } = parseQueryString(props.location.search)
    const unitMeta = UnitMetaData.findOne({ bzId: parseInt(unitId) })
    const mongoId = unitMeta && unitMeta._id
    const floorPlanUploadProcess = mongoId && unitFloorPlanUploadState.find(proc => proc.unitMongoId === mongoId)
    return {
      preferredUnitId: unit,
      inProgress,
      error,
      floorPlanUploadProcess
    }
  }
)(createContainer(
  (props) => {
    const enumFields = ['category', 'subCategory']
    const { unit: unitId, report: reportId } = parseQueryString(props.location.search)
    const unitIdInt = parseInt(unitId)
    const unitHandle = Meteor.subscribe(`${unitsCollName}.byIdWithRoles`, unitIdInt)
    const bzLoginHandle = Meteor.subscribe('users.myBzLogin')
    const reportIdInt = parseInt(reportId)
    const reportHandle = reportId && Meteor.subscribe(`${reportsCollName}.byId`, reportIdInt)
    const loadingUnitInfo = !unitHandle.ready()
    const loadingUserEmail = !bzLoginHandle.ready()
    const loadingFieldValues = enumFields
      .map(name => Meteor.subscribe(`${fieldValsCollName}.fetchByName`, name))
      .filter(handle => !handle.ready()).length > 0
    const loadingReport = !!reportHandle && !reportHandle.ready()

    return ({
      isLoading: loadingUnitInfo || loadingUserEmail || loadingFieldValues || loadingReport,
      unitItem: unitHandle.ready()
        ? Object.assign(Units.findOne({ id: unitIdInt }), UnitMetaData.findOne({ bzId: unitIdInt }))
        : null,
      userBzLogin: bzLoginHandle.ready() ? Meteor.user().bugzillaCreds.login : null,
      userId: bzLoginHandle.ready() ? Meteor.userId() : null,
      availableRoles: unitHandle.ready() ? UnitRolesData.find({ unitBzId: unitIdInt }).fetch().map(roleObj => ({
        type: roleObj.roleType,
        hasDefaultAssignee: roleObj.defaultAssigneeId !== -1,
        assignedToYou: !!roleObj.members.find(({ id }) => id === Meteor.userId()),
        areYouDefAssignee: roleObj.defaultAssigneeId === Meteor.userId()
      })) : [],
      reportItem: Reports.findOne({ id: reportIdInt }),
      fieldValues: enumFields.reduce((all, name) => {
        all[name] = CaseFieldValues.findOne({ name })
        return all
      }, {})
    })
  },
  CaseWizard
)))
