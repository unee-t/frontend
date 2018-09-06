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
import Checkbox from 'material-ui/Checkbox'
import { parseQueryString } from '../../util/parsers'
import InnerAppBar from '../components/inner-app-bar'
import ErrorDialog from '../dialogs/error-dialog'
import Preloader from '../preloader/preloader'
import Units, { collectionName as unitsCollName } from '../../api/units'
import { createCase, clearError } from './case-wizard.actions'
import { placeholderEmailMatcher, roleCanBeOccupantMatcher } from '../../util/matchers'
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
          subCategory: null
        }
      },
      needsNewUser: false,
      newUserEmail: '',
      newUserCanBeOccupant: false,
      newUserIsOccupant: false,
      initDone: false
    }
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevState.needsNewUser !== this.state.needsNewUser && this.state.needsNewUser) {
      this.refs.scrollPane.scrollTop = this.refs.scrollPane.scrollHeight
      this.emailInputEl.focus()
    }
    const { unitItem, userBzLogin } = this.props
    const { inputValues } = this.state
    if (unitItem && prevProps.unitItem === null) {
      const defaultValue = unitItem.components.find(({default_assigned_to: assignedTo}) => assignedTo === userBzLogin).name
      this.setState({
        inputValues: Object.assign({}, inputValues, {
          mandatory: Object.assign({}, inputValues.mandatory, {
            assignedUnitRole: defaultValue
          })
        })
      })
    }
  }

  handleRoleChanged = (evt, val) => {
    const { inputValues } = this.state
    const { default_assigned_to: assignedTo } = this.props.unitItem.components.find(({name}) => name === val)

    this.setState({
      inputValues: Object.assign({}, inputValues, {
        mandatory: Object.assign({}, inputValues.mandatory, {
          assignedUnitRole: val
        })
      }),
      needsNewUser: placeholderEmailMatcher(assignedTo),
      newUserCanBeOccupant: roleCanBeOccupantMatcher(val),
      newUserIsOccupant: false
    })
  }

  handleSubmit = evt => {
    evt.preventDefault()
    if (!this.checkFormInvalid()) {
      const { inputValues: { mandatory, optional }, newUserEmail, newUserIsOccupant } = this.state
      if (optional.details === '') {
        optional.details = mandatory.title
      }
      this.props.dispatch(createCase(
        Object.assign(
          {},
          Object.assign({selectedUnit: this.props.unitItem.name}, mandatory),
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

  render () {
    const { isLoading, fieldValues, unitItem, userBzLogin, dispatch, error, inProgress, reportItem } = this.props
    if (isLoading) {
      return <Preloader />
    }
    const { inputValues, needsNewUser, newUserEmail, newUserIsOccupant, newUserCanBeOccupant } = this.state
    const { mandatory, optional } = inputValues
    const { title, details, assignedUnitRole } = mandatory
    const { category, subCategory } = optional
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
                  {fieldValues.category.values.map(({name}) => (
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
                  {fieldValues.subCategory.values.reduce((all, {name, visibility_values: [relatedCategory]}) => {
                    if (relatedCategory === category) {
                      all.push(
                        <MenuItem key={name} value={name} primaryText={name} />
                      )
                    }
                    return all
                  }, [])}
                </SelectField>
              </div>
            </div>
            <p className='pv0 f6 bondi-blue'>Assign this case to *</p>
            <RadioButtonGroup
              name='assignedUnitRole'
              onChange={this.handleRoleChanged}
              valueSelected={assignedUnitRole}
            >
              {
                unitItem.components
                  .map(({id, name, default_assigned_to: assignedTo}) => ( // TODO: enhance later
                    <RadioButton
                      key={id} value={name} label={name + (assignedTo === userBzLogin ? ' (you)' : '')} disabled={inProgress}
                    />
                  ))
              }
            </RadioButtonGroup>
            {needsNewUser && (
              <div className='mt3'>
                <p className='mv0 pv0 f7 warn-crimson lh-copy'>
                  There is no one in the role of {assignedUnitRole} for this unit yet. Invite a new user to fill
                  the {assignedUnitRole} role or select a different role.
                </p>
                <InputRow label={`Email of the ${assignedUnitRole} to invite *`} value={newUserEmail} inpType='email'
                  onChange={(evt, val) => this.setState({newUserEmail: val})}
                  errorText={(newUserEmail && !emailValidator(newUserEmail)) ? 'Email address is invalid' : ''}
                  inpRef={el => { this.emailInputEl = el }}
                  disabled={inProgress}
                />
                {newUserCanBeOccupant && (
                  <Checkbox
                    label={`This ${assignedUnitRole} is also the occupant of this unit`}
                    labelStyle={controlLabelStyle}
                    checked={newUserIsOccupant}
                    onCheck={(evt, isChecked) => { this.setState({newUserIsOccupant: isChecked}) }}
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
  reportItem: PropTypes.object
}

export default withRouter(connect(
  ({ caseCreationState: { inProgress, error } }, props) => {
    const { unit } = parseQueryString(props.location.search)
    return {
      preferredUnitId: unit,
      inProgress,
      error
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
        ? Object.assign(Units.findOne({id: unitIdInt}), UnitMetaData.findOne({bzId: unitIdInt}))
        : null,
      userBzLogin: bzLoginHandle.ready() ? Meteor.user().bugzillaCreds.login : null,
      reportItem: Reports.findOne({id: reportIdInt}),
      fieldValues: enumFields.reduce((all, name) => {
        all[name] = CaseFieldValues.findOne({name})
        return all
      }, {})
    })
  },
  CaseWizard
)))
