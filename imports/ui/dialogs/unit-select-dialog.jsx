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
import TextField from 'material-ui/TextField'

class UnitSelectDialog extends Component {
  constructor (props) {
    super(props)
    this.state = {
      searchMode: false,
      searchText: '',
      searchResult: [],
      unitId: null
    }
  }

  onSearchChanged = (searchText) => {
    this.setState({searchText})
    if (searchText === '') {
      this.setState({searchMode: false})
    } else {
      this.setState({searchMode: true})
      const matcher = new RegExp(searchText, 'i')
      const searchResult = this.props.unitList
        .filter(unit => !matcher || (unit.name && unit.name.match(matcher)))
      this.setState({
        searchResult: searchResult
      })
    }
  }

  render () {
    const { isLoading, show, onDismissed, inProgress, dispatch, match, unitList } = this.props
    const { searchText, searchMode, searchResult, unitId } = this.state
    const units = searchMode ? searchResult : unitList
    if (isLoading) return <Preloader />
    return (
      <Dialog
        title='Select the unit'
        titleStyle={modalTitleStyle}
        open={show}
        autoDetectWindowHeight
        autoScrollBodyContent
        repositionOnUpdate
        contentStyle={{
          width: '90%',
          height: '90%'
        }}
      >
        {!inProgress && (
          <button onClick={onDismissed}
            className='button b--none bg-transparent absolute top-1 pt2 right-1 outline-0'
          >
            <FontIcon className='material-icons' style={closeDialogButtonStyle}>close</FontIcon>
          </button>
        )}
        <span className='ba b--moon-gray mv2 br1 pv2'>
          <span className={(searchMode ? 'dn' : 'mt3 ml3 absolute left-1')}>
            <FontIcon className={'material-icons'} style={closeDialogButtonStyle}>
              search
            </FontIcon>
          </span>
          <TextField
            hintText={<span className='ml4 '>Unit names </span>}
            underlineShow={false}
            fullWidth
            value={searchText}
            onChange={(evt) => this.onSearchChanged(evt.target.value)}
          />
        </span>
        <div className='pb2 ba b--moon-gray pa2 br1'>
          {units.map(({ name, metaData, description, id }) =>
            <div key={name}>
              <MenuItem innerDivStyle={resetMenuItemDivStyle}
                onClick={() => this.setState({unitId: id})} >
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
            disabled={unitId === null}
            onClick={() => dispatch(push(`/unit/${unitId}/reports/new`))}
          >
            <span className='white f4'>
              Create Report
            </span>
          </RaisedButton>
        </div>
      </Dialog>
    )
  }
}

UnitSelectDialog.propTypes = {
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
}, UnitSelectDialog))
