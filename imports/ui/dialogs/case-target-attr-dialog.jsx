// @flow
import * as React from 'react'
import RaisedButton from 'material-ui/RaisedButton'
import IconButton from 'material-ui/IconButton'
import HeightHackDialog from './height-hack-dialog'
import {
  closeDialogButtonStyle,
  modalBodyStyle,
  modalCustomContentStyle,
  customTitleStyle
} from './generic-dialog.mui-styles'
import FontIcon from 'material-ui/FontIcon'
import moment from 'moment'
import { infoItemLabel } from '../util/static-info-rendering'
import EditableItem from '../components/editable-item'
import DatePicker from 'material-ui/DatePicker'
import TimePicker from 'material-ui/TimePicker'

type Props = {
  show: boolean,
  attrName: string,
  initialValue?: string,
  initialDate?: Date,
  onCancel: () => void,
  showTime?: boolean,
  onSubmit: (value: string, date: Date) => void
}

type State = {
  attrValue: string,
  attrDate: ?Date,
  attrTime: any,
  isEditing: boolean,
  hideDateRow: boolean
}

const displayTextFieldStyle = {
  width: 'fit-content',
  color: '#999'
}

export default class CaseTargetAttrDialog extends React.Component<Props, State> {
  state = {
    attrValue: '',
    attrDate: null,
    attrTime: null,
    isEditing: false,
    hideDateRow: false
  }

  componentDidMount () {
    const { initialValue, initialDate } = this.props
    let initialTime
    if (initialDate) {
      const hours = initialDate.getHours()
      const minutes = initialDate.getMinutes()
      initialTime = moment().add(hours, 'hours').add(minutes, 'minutes').toDate()
    }
    this.setState({
      attrValue: initialValue,
      attrDate: initialDate,
      attrTime: initialTime,
      isEditing: !!initialValue || !!initialDate
    })
  }

  componentDidUpdate (prevProps: Props) {
    const { initialValue, initialDate } = this.props
    const stateMutations = {}
    if (prevProps.initialValue !== initialValue) {
      Object.assign(stateMutations, {
        attrValue: initialValue
      })
    }
    if ((!prevProps.initialDate && !!initialDate) || (
      prevProps.initialDate && initialDate && prevProps.initialDate.getTime() !== initialDate.getTime())
    ) {
      const hours = initialDate.getHours()
      const minutes = initialDate.getMinutes()
      Object.assign(stateMutations, {
        attrDate: initialDate,
        attrTime: moment().add(hours, 'hours').add(minutes, 'minutes').toDate()
      })
    }

    if (Object.keys(stateMutations).length > 0) {
      this.setState({ ...stateMutations, isEditing: true })
    }
  }

  handleSubmitClicked = () => {
    const { attrValue, attrDate, attrTime } = this.state
    const hours = attrTime ? attrTime.getHours() : 0
    const minutes = attrTime ? attrTime.getMinutes() : 0
    const finalDateTime = moment(attrDate)
    finalDateTime.add(hours, 'hours').add(minutes, 'minutes')
    this.props.onSubmit(attrValue, finalDateTime.toDate())
  }

  handleHeightChanged = (height: number) => {
    const { hideDateRow } = this.state
    if (hideDateRow !== (height < 300)) {
      this.setState({
        hideDateRow: height < 300
      })
    }
  }

  render () {
    const { show, onCancel, attrName, showTime } = this.props
    const { attrValue, attrDate, attrTime, isEditing, hideDateRow } = this.state
    const now = new Date()
    return (
      <HeightHackDialog
        padding={50}
        open={show}
        title={(isEditing ? 'Edit ' : 'Create ') + attrName}
        bodyStyle={modalBodyStyle}
        contentStyle={modalCustomContentStyle}
        titleStyle={customTitleStyle}
        onRequestClose={onCancel}
        onHeightChange={this.handleHeightChanged}
      >
        <div className='absolute top-1 right-1'>
          <IconButton onClick={onCancel}>
            <FontIcon className='material-icons' style={closeDialogButtonStyle}>close</FontIcon>
          </IconButton>
        </div>
        <div className='flex flex-column h6 overflow-auto'>
          <EditableItem
            isMultiLine
            label={attrName}
            onEdit={val => { this.setState({ attrValue: val }) }}
            currentValue={attrValue}
            rowsMax={3}
          />
          <div className='mt3 flex-grow'>
            {!hideDateRow && infoItemLabel('Deadline')}
            {!hideDateRow && (
              <div className='flex'>
                <div className='flex-grow flex items-center'>
                  <div className='mr2'>
                    <FontIcon className='material-icons' color='#999'>date_range</FontIcon>
                  </div>
                  <DatePicker
                    minDate={now}
                    onChange={(evt, val) => {
                      this.setState({ attrDate: val })
                    }}
                    formatDate={date => moment(date).format('D MMM YYYY')}
                    value={attrDate}
                    hintText='Date'
                    textFieldStyle={displayTextFieldStyle}
                  />
                </div>
                <div className='flex-grow flex items-center ml2'>
                  {showTime && (
                    <div className='mr2'>
                      <FontIcon className='material-icons' color='#999'>access_time</FontIcon>
                    </div>
                  )}
                  {showTime && (
                    <TimePicker
                      hintText='Time'
                      value={attrTime}
                      onChange={(evt, val) => {
                        this.setState({ attrTime: val })
                      }}
                      textFieldStyle={displayTextFieldStyle}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
          <div>
            <RaisedButton
              fullWidth
              primary
              disabled={!attrValue || !attrDate || (!attrTime && showTime)}
              onClick={this.handleSubmitClicked}
            >
              <span className='fw5 white'>{isEditing ? 'Save Changes' : `Add ${attrName}`}</span>
            </RaisedButton>
          </div>
        </div>
      </HeightHackDialog>
    )
  }
}
