import React, { Component } from 'react'
// import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import actions from './unit-create.actions'

import InputRow from '../components/input-row'

export const userRoles = [
  'Agent',
  'Owner/landlord',
  'Tenant',
  'Management Company',
  'Contractor',
  'Other'
]

export class UnitCreate extends Component {
  constructor () {
    super(...arguments)
    this.inputs = {}
  }
  setMember (memName, el) {
    this.inputs[memName] = el
  }
  handleSaveAndNext () {
    const { createAndNext } = actions
    this.props.dispatch(createAndNext(this.inputs.unitName.value, this.inputs.userRole.value, this.inputs.isOccupant.checked))
  }
  handleAddMoreDetails () {
    const { createAndMore } = actions
    this.props.dispatch(createAndMore(this.inputs.unitName.value, this.inputs.userRole.value, this.inputs.isOccupant.checked))
  }
  wrapHandler (handler) {
    return e => {
      e.preventDefault()
      handler.apply(this, arguments)
    }
  }
  render () {
    const buttonClasses = 'f6 link dim ph3 pv2 mb2 dib white bg-dark-blue'
    return (
      <div className='w-100'>
        <main className='pa4 black-80'>
          <h2 className='f3 fw6 ph0 mh0 tc'>Create your first unit</h2>
          <form className='measure center'>
            <InputRow label='Give the unit a unique name *' identifier='unit-name' inpRef={el => this.setMember('unitName', el)} />
            <InputRow label='What is your relation to this unit? *' identifier='user-role' inpRef={el => this.setMember('userRole', el)} >
              <select defaultValue='dummy'>
                <option disabled='true' value='dummy'>Select...</option>
                {userRoles.map((role, i) => (
                  <option key={i} value={role}>{role}</option>
                ))}
              </select>
            </InputRow>
            <div className='flex items-center mb2'>
              <span className='flex-auto'>Are you the occupant? *</span>
              <input className='mr2' type='checkbox' id='isOccupant' name='isOccupant' ref={el => this.setMember('isOccupant', el)} />
              <label className='lh-copy' htmlFor='isOccupant'>Yes</label>
            </div>
            <div className='tc'>
              <button className={buttonClasses} ref='saveAndNextButton' onClick={this.wrapHandler(this.handleSaveAndNext)}>
                Save and next
              </button>
            </div>
            <div className='tc'>
              <h3>OR</h3>
            </div>
            <div className='tc'>
              <button className={buttonClasses} ref='addMoreDetailsButton' onClick={this.wrapHandler(this.handleAddMoreDetails)}>
                Add more details
              </button>
            </div>
          </form>
        </main>
      </div>
    )
  }
}

UnitCreate.propTypes = {}

export default connect(
  () => ({}) // map redux state to props
)(createContainer(() => ({}), UnitCreate)) // map meteor state to props
