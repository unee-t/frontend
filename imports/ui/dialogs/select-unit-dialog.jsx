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
import { Route, Link } from 'react-router-dom'

class SelectUnitDialog extends Component {
  render () {
    const { show, onDismissed, inProgress, units, dispatch, match } = this.props
    console.log('match', match)
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
        <div className='overflow-scroll ba b--moon-gray mt2 pa2 tc br1 mr3 ml3'>
          {units.map(({ unitTitle, unitType, items }) =>
            <div key={unitTitle}>
              {/* <Link to={`/unit/${items[0].id}/reports/new`} className='link flex-grow relative w-100'> */}
              <MenuItem innerDivStyle={resetMenuItemDivStyle} 
                onClick={() => dispatch(push(`/unit/${items[0].id}/reports/new`))} >
                <div className='mt2 ph2 bb b--very-light-gray br1 w-100 flex items-center pa2'>
                  {/* <UnitTypeIcon metaData={unitType} /> */}
                  <div className='ml3 mv1 semi-dark-gray lh-copy flex-grow overflow-hidden'>
                    <div className='ti1 ellipsis'>{unitTitle}</div>
                    items.id {items[0].id}
                    {/* <div className='ti1 ellipsis silver'>{items[0].unitMetaData.moreInfo}&nbsp;</div> */}
                  </div>
                </div>
              </MenuItem>
              {/* </Link> */}
              <Route path={`/unit/${items[0].id}/reports/new`}
                // children={({ match }) => (
                //   <CreateReportDialog
                //     show={!!match}
                //     onDismissed={() => dispatch(goBack())}
                //     unitName={unitTitle}
                //   />
                // )} 
                render={() =>
                  <CreateReportDialog
                    key={items.id}
                    show={!!match}
                    onDismissed={() => dispatch(goBack())}
                    unitName={unitTitle}
                  />
                }
              />
            </div>
          )}
        </div>
      </Dialog>
    )
  }
}

SelectUnitDialog.propTypes = {
  show: PropTypes.bool.isRequired,
  onDismissed: PropTypes.func.isRequired
}

export default connect(({ reportCreationState }) => ({
  inProgress: !!reportCreationState.inProgress,
  error: reportCreationState.error || ''
}))(createContainer(() => ({}), SelectUnitDialog))
