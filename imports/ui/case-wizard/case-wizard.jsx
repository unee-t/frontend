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
import CaseFieldValues from '../../api/case-field-values'
import InnerAppBar from '../components/inner-app-bar'
import Preloader from '../preloader/preloader'
import Units from '../../api/units'

import {
  textInputFloatingLabelStyle,
  textInputStyle,
  textInputUnderlineFocusStyle,
  selectInputIconStyle
} from '../components/form-controls.mui-styles'

const fieldNames = [
  'rep_platform',
  'cf_ipi_clust_6_claim_type',
  'priority',
  'bug_severity'
]

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
          subCategory: null
        }
      }
    }
  }
  render () {
    const { loadingUnits, loadingUserEmail, loadingFieldValues, fieldValues, units, userEmail } = this.props
    if (loadingUnits || loadingUserEmail || loadingFieldValues) {
      return <Preloader />
    }
    const { inputValues } = this.state
    const { mandatory, optional } = inputValues
    const { selectedUnit, title, details, assignedUnitRole } = mandatory
    const { category, subCategory, priority, severity } = optional
    // console.log('fieldValues', fieldValues)
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
            required
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
              <MenuItem key={unit.name} value={unit} primaryText={unit.name} />
            ))}
          </SelectField>
          <TextField
            floatingLabelText='Case title *'
            floatingLabelShrinkStyle={textInputFloatingLabelStyle}
            underlineFocusStyle={textInputUnderlineFocusStyle}
            inputStyle={textInputStyle}
            required
            fullWidth
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
            required
            rowsMax={3}
            fullWidth
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
                {fieldValues[fieldNames[0]].values.map(({name}) => (
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
                disabled={!category}
                value={subCategory}
                onChange={(evt, idx, val) => this.setState({
                  inputValues: Object.assign({}, inputValues, {
                    optional: Object.assign({}, optional, {
                      subCategory: val
                    })
                  })
                })}
              >
                {fieldValues[fieldNames[1]].values.reduce((all, {name, visibility_values: [relatedCategory]}) => {
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
                value={priority}
                onChange={(evt, idx, val) => this.setState({
                  inputValues: Object.assign({}, inputValues, {
                    optional: Object.assign({}, optional, {
                      priority: val
                    })
                  })
                })}
              >
                {fieldValues[fieldNames[2]].values.map(({name}) => (
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
                value={severity}
                onChange={(evt, idx, val) => this.setState({
                  inputValues: Object.assign({}, inputValues, {
                    optional: Object.assign({}, optional, {
                      severity: val
                    })
                  })
                })}
              >
                {fieldValues[fieldNames[3]].values.map(({name}) => (
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
              {selectedUnit.components.map(({id, name, default_assigned_to: assignedTo}) => ( // TODO: enhance later
                <RadioButton key={id} value={name} label={name + (assignedTo === userEmail ? ' (you)' : '')} />
              ))}
            </RadioButtonGroup>
          ) : (
            <p className='pv0 silver i'>
              Select a unit first to see the relevant roles
            </p>
          )}
        </div>
        <div className='ph3 pb3'>
          <RaisedButton fullWidth backgroundColor='var(--bondi-blue)' disabled={
            Object.keys(mandatory).filter(fieldName => !mandatory[fieldName]).length > 0
          }>
            <span className='white f4 b'>
              Add Case
            </span>
          </RaisedButton>
        </div>
      </div>
    )
  }
}

CaseWizard.propTypes = {
  loadingUnits: PropTypes.bool.isRequired,
  loadingUserEmail: PropTypes.bool.isRequired,
  loadingFieldValues: PropTypes.bool.isRequired,
  units: PropTypes.array,
  userEmail: PropTypes.string,
  fieldValues: PropTypes.object
}

export default connect(
  () => ({})
)(createContainer(
  () => ({
    loadingUnits: !Meteor.subscribe('unitsForReporting').ready(),
    loadingUserEmail: !Meteor.subscribe('myUserBzLogin').ready(),
    loadingFieldValues: fieldNames
      .map(name => Meteor.subscribe('caseFieldValues.fetchByName', name))
      .filter(handle => !handle.ready()).length > 0,
    units: Units.find().fetch(),
    userEmail: Meteor.user() && Meteor.user().bugzillaCreds && Meteor.user().bugzillaCreds.login,
    fieldValues: fieldNames.reduce((all, name) => {
      all[name] = CaseFieldValues.findOne({name})
      return all
    }, {})
  }),
  CaseWizard
))
