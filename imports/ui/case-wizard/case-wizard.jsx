import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import { goBack, replace } from 'react-router-redux'
import { withRouter } from 'react-router-dom'
import TextField from 'material-ui/TextField'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'
import RaisedButton from 'material-ui/RaisedButton'
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton'
import CircularProgress from 'material-ui/CircularProgress'
import CaseFieldValues, { collectionName as fieldValsCollName } from '../../api/case-field-values'
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
          selectedUnit: null,
          title: '',
          details: '',
          assignedUnitRole: null
        },
        optional: {
          category: null,
          subCategory: null,
          priority: null,
          severity: null
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
    const {dispatch, match, units} = this.props
    const {selectedUnit} = this.state.inputValues.mandatory
    if (prevState.needsNewUser !== this.state.needsNewUser && this.state.needsNewUser) {
      this.refs.scrollPane.scrollTop = this.refs.scrollPane.scrollHeight
      this.emailInputEl.focus()
    }
    if (prevState.inputValues.mandatory.selectedUnit !== selectedUnit) {
      const unitId = units.find(unit => unit.name === selectedUnit).id
      dispatch(replace(`${match.url}?unit=${unitId}`))
    }
  }

  componentWillReceiveProps (nextProps) {
    const {preferredUnitId} = this.props
    const {inputValues, initDone} = this.state
    if (nextProps.units.length > 0 && !initDone && preferredUnitId && !this.state.inputValues.mandatory.selectedUnit) {
      this.setState({
        inputValues: Object.assign({}, inputValues, {
          mandatory: Object.assign({}, inputValues.mandatory, {
            selectedUnit: nextProps.units.find(unit => unit.id === parseInt(preferredUnitId)).name
          })
        }),
        initDone: true
      })
    }
  }

  getSelectedUnitObj = () => {
    const { selectedUnit } = this.state.inputValues.mandatory
    if (selectedUnit) {
      return this.props.units.filter(unit => unit.name === selectedUnit)[0]
    }
  }

  handleRoleChanged = (evt, val) => {
    const { inputValues } = this.state
    const { default_assigned_to: assignedTo } = this.getSelectedUnitObj().components.find(({name}) => name === val)

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
      this.props.dispatch(createCase(
        Object.assign(
          {},
          mandatory,
          optional
        ),
        newUserEmail,
        newUserIsOccupant
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
    const {
      loadingUnits, loadingUserEmail, loadingFieldValues, fieldValues, units, userEmail, dispatch, error, inProgress
    } = this.props
    if (loadingUnits || loadingUserEmail || loadingFieldValues) {
      return <Preloader />
    }
    const { inputValues, needsNewUser, newUserEmail, newUserIsOccupant, newUserCanBeOccupant } = this.state
    const { mandatory, optional } = inputValues
    const { selectedUnit, title, details, assignedUnitRole } = mandatory
    const { category, subCategory, priority, severity } = optional
    return (
      <div className='full-height flex flex-column'>
        <InnerAppBar title='New Case' onBack={() => dispatch(goBack())} />
        <form onSubmit={this.handleSubmit}>
          <div className='overflow-auto flex-grow pa3' ref='scrollPane'>
            <SelectField
              floatingLabelText='Relevant Unit *'
              fullWidth
              floatingLabelShrinkStyle={textInputFloatingLabelStyle}
              labelStyle={textInputStyle}
              menuStyle={textInputStyle}
              iconStyle={selectInputIconStyle}
              underlineFocusStyle={textInputUnderlineFocusStyle}
              disabled={inProgress}
              value={selectedUnit}
              onChange={(evt, idx, val) => val !== selectedUnit && this.setState({
                inputValues: Object.assign({}, inputValues, {
                  mandatory: Object.assign({}, mandatory, {
                    selectedUnit: val,
                    assignedUnitRole: null
                  })
                }),
                needsNewUser: false
              })}
            >
              {units.map(unit => (
                <MenuItem key={unit.name} value={unit.name} primaryText={unit.name} />
              ))}
            </SelectField>
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
              floatingLabelText='Details *'
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
                  mandatory: Object.assign({}, mandatory, {
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
            <div className='flex'>
              <div className='flex-grow mr2'>
                <SelectField
                  floatingLabelText='Priority'
                  fullWidth
                  floatingLabelShrinkStyle={textInputFloatingLabelStyle}
                  labelStyle={textInputStyle}
                  menuStyle={textInputStyle}
                  iconStyle={selectInputIconStyle}
                  underlineFocusStyle={textInputUnderlineFocusStyle}
                  disabled={inProgress}
                  value={priority}
                  onChange={(evt, idx, val) => this.setState({
                    inputValues: Object.assign({}, inputValues, {
                      optional: Object.assign({}, optional, {
                        priority: val
                      })
                    })
                  })}
                >
                  {fieldValues.priority.values.map(({name}) => (
                    <MenuItem key={name} value={name} primaryText={name} />
                  ))}
                </SelectField>
              </div>
              <div className='flex-grow ml2'>
                <SelectField
                  floatingLabelText='Severity'
                  fullWidth
                  floatingLabelShrinkStyle={textInputFloatingLabelStyle}
                  labelStyle={textInputStyle}
                  menuStyle={textInputStyle}
                  iconStyle={selectInputIconStyle}
                  underlineFocusStyle={textInputUnderlineFocusStyle}
                  disabled={inProgress}
                  value={severity}
                  onChange={(evt, idx, val) => this.setState({
                    inputValues: Object.assign({}, inputValues, {
                      optional: Object.assign({}, optional, {
                        severity: val
                      })
                    })
                  })}
                >
                  {fieldValues.severity.values.map(({name}) => (
                    <MenuItem key={name} value={name} primaryText={name} />
                  ))}
                </SelectField>
              </div>
            </div>
            <p className='pv0 f6 bondi-blue'>Assign this case to *</p>
            {selectedUnit ? (
              <RadioButtonGroup
                name='assignedUnitRole'
                onChange={this.handleRoleChanged}
                valueSelected={assignedUnitRole}
              >
                {
                  this.getSelectedUnitObj().components
                    .map(({id, name, default_assigned_to: assignedTo}) => ( // TODO: enhance later
                      <RadioButton
                        key={id} value={name} label={name + (assignedTo === userEmail ? ' (you)' : '')} disabled={inProgress}
                      />
                    ))
                }
              </RadioButtonGroup>
            ) : (
              <p className='pv0 silver i'>
                Select a unit first to see the relevant roles
              </p>
            )}
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
  loadingUnits: PropTypes.bool.isRequired,
  loadingUserEmail: PropTypes.bool.isRequired,
  loadingFieldValues: PropTypes.bool.isRequired,
  inProgress: PropTypes.bool.isRequired,
  error: PropTypes.string,
  units: PropTypes.array,
  userEmail: PropTypes.string,
  fieldValues: PropTypes.object,
  preferredUnitId: PropTypes.string
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
  () => {
    const enumFields = ['category', 'subCategory', 'priority', 'severity']
    return ({
      loadingUnits: !Meteor.subscribe(`${unitsCollName}.forReporting`).ready(),
      loadingUserEmail: !Meteor.subscribe('users.myBzLogin').ready(),
      loadingFieldValues: enumFields
        .map(name => Meteor.subscribe(`${fieldValsCollName}.fetchByName`, name))
        .filter(handle => !handle.ready()).length > 0,
      units: Units.find().fetch(),
      userEmail: Meteor.user() && Meteor.user().bugzillaCreds && Meteor.user().bugzillaCreds.login,
      fieldValues: enumFields.reduce((all, name) => {
        all[name] = CaseFieldValues.findOne({name})
        return all
      }, {})
    })
  },
  CaseWizard
)))
