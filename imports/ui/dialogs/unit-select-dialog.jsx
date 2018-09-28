import React, { Component } from 'react'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import PropTypes from 'prop-types'
import Dialog from 'material-ui/Dialog'
import FontIcon from 'material-ui/FontIcon'
import UnitTypeIcon from '../unit-explorer/unit-type-icon'
import MenuItem from 'material-ui/MenuItem'
import { resetMenuItemDivStyle } from '../general.mui-styles'
import CircularProgress from 'material-ui/CircularProgress'
import { Meteor } from 'meteor/meteor'
import Units, { collectionName } from '../../api/units'
import TextField from 'material-ui/TextField'
import { NoItemMsg } from '../explorer-components/no-item-msg'
import {
  customTitleStyle,
  closeDialogButtonStyle
} from './generic-dialog.mui-styles'
import { Link } from 'react-router-dom'

class UnitSelectDialog extends Component {
  constructor (props) {
    super(props)
    this.state = {
      searchMode: false,
      searchText: '',
      searchResult: []
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
    const { show, onDismissed, inProgress, unitList, onUnitClick } = this.props
    const { searchText, searchMode, searchResult } = this.state
    const units = searchMode ? searchResult : unitList
    const actions =
      <div className='tc ph2'>
        <Link className={'bondi-blue link ' + (units.length === 0 ? 'dn' : '')}
          to={`/unit/new`}
        >Add a new unit</Link>
      </div>
    return (
      <Dialog
        title='Select Unit'
        actions={actions}
        titleStyle={customTitleStyle}
        open={show}
        repositionOnUpdate
        contentStyle={{
          width: '90%',
          height: '90%'
        }}
        bodyStyle={{
          paddingBottom: '0',
          borderTop: 'none',
          borderBottom: 'none'
        }}
      >
        {!inProgress && (
          <button onClick={onDismissed}
            className='button b--none bg-transparent absolute top-1 right-1'
          >
            <FontIcon className='material-icons' style={closeDialogButtonStyle}>close</FontIcon>
          </button>
        )}
        <div>
          <div className='ba b--moon-gray mt1 mb2 br1 pv1'>
            <span className='ml3 absolute left-1' style={{marginTop: '0.2rem'}}>
              <FontIcon className={'material-icons'} style={closeDialogButtonStyle}>
                search
              </FontIcon>
            </span>
            <TextField
              hintText={<span className='ml1 '>Unit names </span>}
              underlineShow={false}
              fullWidth
              value={searchText}
              onChange={(evt) => this.onSearchChanged(evt.target.value)}
              style={{paddingLeft: '2rem', height: '24px'}}
              hintStyle={{bottom: '0px'}}
            />
          </div>
        </div>
        <div className='flex flex-column'>
          <div className='ba b--moon-gray br1 flex-grow overflow-auto' style={{height: '370px'}}>
            {
              inProgress && (
                <div className='absolute top-0 right-0 bottom-0 left-0'>
                  <CircularProgress color='white' size={30} />
                </div>)
            }
            {!inProgress && units.length ? (
              <div>
                {units.map(({ name, metaData, description, id }) =>
                  <div key={name}>
                    <MenuItem
                      innerDivStyle={resetMenuItemDivStyle}
                      onClick={() => onUnitClick(id)}
                      style={{whiteSpace: 'none', display: 'inline'}}
                    >
                      <div className='bt b--very-light-gray br1 w-100 pl2 flex items-center'>
                        <UnitTypeIcon metaData={metaData} />
                        <div className={'ml3 mv3 semi-dark-gray lh-copy flex-grow'}>
                          <div>{(metaData && metaData.displayName) || name}</div>
                        </div>
                      </div>
                    </MenuItem>
                  </div>
                )}
              </div>
            ) : (
              <NoItemMsg item='unit' addUnit />
            )}
          </div>
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
