import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import { goBack } from 'react-router-redux'
import TextField from 'material-ui/TextField'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'
import RaisedButton from 'material-ui/RaisedButton'
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton'
import CircularProgress from 'material-ui/CircularProgress'
import CaseFieldValues from '../../api/case-field-values'
import InnerAppBar from '../components/inner-app-bar'
import ErrorDialog from '../components/error-dialog'
import Preloader from '../preloader/preloader'
import Units from '../../api/units'
import { caseFieldMapping } from '../../api/cases'
import { createCase, clearError } from './case-wizard.actions'

import {
  textInputFloatingLabelStyle,
  textInputStyle,
  textInputUnderlineFocusStyle,
  selectInputIconStyle
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
      }
    }
  }
  getSelectedUnitObj () {
    const { selectedUnit } = this.state.inputValues.mandatory
    if (selectedUnit) {
      return this.props.units.filter(unit => unit.name === selectedUnit)[0]
    }
  }
  render () {
    const {
      loadingUnits, loadingUserEmail, loadingFieldValues, fieldValues, units, userEmail, dispatch, error, inProgress
    } = this.props
    if (loadingUnits || loadingUserEmail || loadingFieldValues) {
      return <Preloader />
    }
    const { inputValues } = this.state
    const { mandatory, optional } = inputValues
    const { selectedUnit, title, details, assignedUnitRole } = mandatory
    const { category, subCategory, priority, severity } = optional
    return (
      <div className='full-height flex flex-column'>
        <InnerAppBar title='New Case' onBack={() => this.props.dispatch(goBack())} />
        <div className='overflow-auto flex-grow pa3'>
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
              })
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
                {fieldValues[caseFieldMapping.category].values.map(({name}) => (
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
                {fieldValues[caseFieldMapping.subCategory].values.reduce((all, {name, visibility_values: [relatedCategory]}) => {
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
                {fieldValues[caseFieldMapping.priority].values.map(({name}) => (
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
                {fieldValues[caseFieldMapping.severity].values.map(({name}) => (
                  <MenuItem key={name} value={name} primaryText={name} />
                ))}
              </SelectField>
            </div>
          </div>
          <p className='pv0 f6 bondi-blue'>Assign this case to *</p>
          {selectedUnit ? (
            <RadioButtonGroup
              name='assignedUnitRole'
              onChange={(evt, val) => this.setState({
                inputValues: Object.assign({}, inputValues, {
                  mandatory: Object.assign({}, mandatory, {
                    assignedUnitRole: val
                  })
                })
              })}
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
        </div>
        <div className='ph3 pb3'>
          <RaisedButton
            fullWidth backgroundColor='var(--bondi-blue)'
            disabled={(Object.keys(mandatory).filter(fieldName => !mandatory[fieldName]).length > 0) || inProgress}
            onClick={() => dispatch(createCase(Object.assign({}, mandatory, optional)))}
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
  fieldValues: PropTypes.object
}

export default connect(
  ({ caseCreationState: { inProgress, error } }) => ({
    inProgress,
    error
  })
)(createContainer(
  () => {
    const {category, subCategory, priority, severity} = caseFieldMapping
    const enumFields = [category, subCategory, priority, severity]
    return ({
      loadingUnits: !Meteor.subscribe('unitsForReporting').ready(),
      loadingUserEmail: !Meteor.subscribe('myUserBzLogin').ready(),
      loadingFieldValues: enumFields
        .map(name => Meteor.subscribe('caseFieldValues.fetchByName', name))
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

))
