import React, { Component } from 'react'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import PropTypes from 'prop-types'
import Dialog from 'material-ui/Dialog'
import RaisedButton from 'material-ui/RaisedButton'
import CircularProgress from 'material-ui/CircularProgress'
import FontIcon from 'material-ui/FontIcon'
import InputRow from '../components/input-row'
import { modalTitleStyle, closeDialogButtonStyle } from './generic-dialog.mui-styles'
import { createReport } from '../report-wizard/report-wizard.actions'

class CreateReportDialog extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      reportTitle: ''
    }
  }
  componentDidUpdate (prevProps) {
    setTimeout(() => {
      if (this.props.show && !prevProps.show) {
        this.titleInputEl.focus()
      }
    }, 300)
  }
  handleSubmit = evt => {
    evt.preventDefault()
    const { reportTitle } = this.state
    const { unitName } = this.props
    this.props.dispatch(createReport(unitName, reportTitle))
  }
  render () {
    const { show, onDismissed, inProgress } = this.props
    const { reportTitle } = this.state
    return (
      <Dialog
        title='Name your report'
        titleStyle={modalTitleStyle}
        open={show}
      >
        {!inProgress && (
          <button onClick={onDismissed}
            className='button b--none bg-transparent absolute top-1 pt2 right-1 outline-0'
          >
            <FontIcon className='material-icons' style={closeDialogButtonStyle}>close</FontIcon>
          </button>
        )}
        <form onSubmit={this.handleSubmit}>
          <InputRow label='Report title' value={reportTitle}
            onChange={(evt, val) => this.setState({reportTitle: val})}
            inpRef={el => { this.titleInputEl = el }}
            disabled={inProgress}
          />
          <div className='tr mt2'>
            <RaisedButton
              backgroundColor='var(--bondi-blue)'
              disabled={!reportTitle || reportTitle.length === 0 || inProgress}
              type='submit'
            >
              {inProgress ? (
                <div className='absolute top-0 right-0 bottom-0 left-0'>
                  <CircularProgress color='white' size={30} />
                </div>
              ) : (
                <span className='white fw5'>
                  Next
                </span>
              )}
            </RaisedButton>
          </div>
        </form>
      </Dialog>
    )
  }
}

CreateReportDialog.propTypes = {
  show: PropTypes.bool.isRequired,
  onDismissed: PropTypes.func.isRequired,
  unitName: PropTypes.string.isRequired,
  inProgress: PropTypes.bool.isRequired
}

export default connect(({ reportCreationState }) => ({
  inProgress: !!reportCreationState.inProgress
}))(createContainer(() => ({}), CreateReportDialog))
