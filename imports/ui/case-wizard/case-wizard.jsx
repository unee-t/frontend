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
import InnerAppBar from '../components/inner-app-bar'
import Preloader from '../preloader/preloader'
import Units from '../../api/units'

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
      selectedUnit: null
    }
  }
  render () {
    const { loadingUnits, units } = this.props
    if (loadingUnits) {
      return <Preloader />
    }
    return (
      <div className='full-height flex flex-column'>
        <InnerAppBar title='New Case' onBack={() => this.props.dispatch(goBack())} />
        <div className='overflow-auto flex-grow pa3'>
          <SelectField
            floatingLabelText='Relevant Unit'
            fullWidth
            floatingLabelShrinkStyle={textInputFloatingLabelStyle}
            labelStyle={textInputStyle}
            menuStyle={textInputStyle}
            iconStyle={selectInputIconStyle}
            underlineFocusStyle={textInputUnderlineFocusStyle}
            value={this.state.selectedUnit}
            onChange={(evt, idx, val) => this.setState({selectedUnit: val})}
          >
            {units.map(unit => (
              <MenuItem value={unit} primaryText={unit.name} />
            ))}
          </SelectField>
          <TextField
            floatingLabelText='Case title *'
            floatingLabelShrinkStyle={textInputFloatingLabelStyle}
            underlineFocusStyle={textInputUnderlineFocusStyle}
            inputStyle={textInputStyle}
            fullWidth
          />
          <TextField
            floatingLabelText='Details *'
            floatingLabelShrinkStyle={textInputFloatingLabelStyle}
            underlineFocusStyle={textInputUnderlineFocusStyle}
            textareaStyle={textInputStyle}
            multiLine
            rowsMax={3}
            fullWidth
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
              >
                <MenuItem value={1} primaryText='dummy' />
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
              >
                <MenuItem value={1} primaryText='dummy' />
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
              >
                <MenuItem value={1} primaryText='dummy' />
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
              >
                <MenuItem value={1} primaryText='dummy' />
              </SelectField>
            </div>
          </div>
        </div>
        <div className='ph3 pb3'>
          <RaisedButton fullWidth backgroundColor='var(--bondi-blue)'>
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
  units: PropTypes.array
}

export default connect(
  () => ({})
)(createContainer(
  () => ({
    loadingUnits: !Meteor.subscribe('unitsForReporting').ready(),
    units: Units.find().fetch()
  }),
  CaseWizard
))
