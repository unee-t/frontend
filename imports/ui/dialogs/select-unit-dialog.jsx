import React, { Component } from 'react'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import PropTypes from 'prop-types'
import Dialog from 'material-ui/Dialog'
import { push, goBack } from 'react-router-redux'
import FontIcon from 'material-ui/FontIcon'
import { modalTitleStyle, closeDialogButtonStyle } from './generic-dialog.mui-styles'
import UnitTypeIcon from '../unit-explorer/unit-type-icon'
import MenuItem from 'material-ui/MenuItem'
import { resetMenuItemDivStyle } from '../general.mui-styles'
import CreateReportDialog from '../dialogs/create-report-dialog'
import { Route } from 'react-router-dom'
import { Meteor } from 'meteor/meteor'
import Units, { collectionName } from '../../api/units'
import Preloader from '../preloader/preloader'
import RaisedButton from 'material-ui/RaisedButton'

class SelectUnitDialog extends Component {
  render () {
    const { isLoading, show, onDismissed, inProgress, dispatch, match, unitList } = this.props
    if (isLoading) return <Preloader />
    return (
      <Dialog
        title='Select the unit'
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
        <div className='overflow-auto'>
          <div className='pb2 ba b--moon-gray pa2 br1'>
            {unitList.map(({ name, metaData, description, id }) =>
              <div key={name}>
                <MenuItem innerDivStyle={resetMenuItemDivStyle}
                  onClick={() => dispatch(push(`/unit/${id}/reports/new`))} >
                  <div className='bb b--very-light-gray br1 w-100 flex items-center'>
                    <UnitTypeIcon metaData={metaData} />
                    <div className='ml3 mv1 semi-dark-gray lh-copy flex-grow overflow-hidden'>
                      <div className='ti1 ellipsis'>{name}</div>
                      <div className='ti1 ellipsis silver'>{description}&nbsp;</div>
                    </div>
                  </div>
                </MenuItem>
                <Route path={`/unit/${id}/reports/new`}
                  render={() =>
                    <CreateReportDialog
                      key={id}
                      show={!!match}
                      onDismissed={() => dispatch(goBack())}
                      unitName={name}
                    />
                  }
                />
              </div>
            )}
          </div>
          <div className='bondi-blue tc pa2' onClick={() => dispatch(push(`/unit/new`))} >
            <span> Add a new unit </span>
          </div>
          <div className='ph3'>
            <RaisedButton
              fullWidth
              backgroundColor='var(--bondi-blue)'
              type='submit'
            >
              <span className='white f4'>
                Create Report
              </span>
            </RaisedButton>
          </div>
        </div>
      </Dialog>
    )
  }
}

SelectUnitDialog.propTypes = {
  show: PropTypes.bool.isRequired,
  onDismissed: PropTypes.func.isRequired
}

let unitsError
export default connect(({ reportCreationState }) => ({
  inProgress: !!reportCreationState.inProgress,
  error: reportCreationState.error || ''
}))(createContainer(() => {
  const unitsHandle = Meteor.subscribe(`${collectionName}.forBrowsing`, {
    onStop: (error) => {
      unitsError = error
    }
  })
  return {
    unitList: Units.find().fetch().map(unit => Object.assign({}, unit, {
      metaData: unit.metaData()
    })),
    isLoading: !unitsHandle.ready(),
    unitsError
  }
}, SelectUnitDialog))
