// @flow
/* global SyntheticInputEvent, HTMLInputElement */
import * as React from 'react'
import Checkbox from 'material-ui/Checkbox'
import FontIcon from 'material-ui/FontIcon'
import InputRow from './input-row'

type Props = {
  inpRef?: (el: React.Node) => void,
  label?: string,
  value?: string,
  onChange: (evt: SyntheticInputEvent<HTMLInputElement>) => void
}
type State = {
  showPass: boolean
}
export default class PasswordInput extends React.Component<Props, State> {
  state = {
    showPass: false
  }

  render () {
    const { label, inpRef, onChange, value } = this.props
    return (
      <div className='relative'>
        <InputRow
          label={label || 'Password'} {...{ inpRef, onChange, value }}
          inpType={this.state.showPass ? 'text' : 'password'}
        />
        <div className='absolute bottom-1 right-0 tl'>
          <Checkbox
            checked={this.state.showPass}
            onCheck={(evt, isChecked) => this.setState({ showPass: isChecked })}
            checkedIcon={<FontIcon color='var(--bondi-blue)' className='material-icons'>visibility</FontIcon>}
            uncheckedIcon={<FontIcon className='material-icons'>visibility_off</FontIcon>}
          />
        </div>
      </div>
    )
  }
}
