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
  closeDialogButtonStyle,
  customBodyStyle
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
    this.setState({ searchText })
    if (searchText === '') {
      this.setState({ searchMode: false })
    } else {
      this.setState({ searchMode: true })
      const matcher = new RegExp(searchText, 'i')
      const searchResult = this.props.unitList.filter(unitItem => unitItem.is_active)
        .filter(unit => !matcher || (unit.name && unit.name.match(matcher)))
      this.setState({
        searchResult: searchResult
      })
    }
  }

  render () {
    const { show, onDismissed, inProgress, unitList, onUnitClick, isLoading } = this.props
    const { searchText, searchMode, searchResult } = this.state
    const units = searchMode ? searchResult : unitList.filter(unitItem => unitItem.is_active)
    const actions =
      <div className='tc pa2 bg-bondi-blue'>
        <Link className={'white link ph3 br1 b--none pv2 lh-title dim' + (units.length === 0 ? 'dn' : '')}
          to={`/unit/new`}
        >Add a new unit</Link>
      </div>
    return (
      <Dialog
        title='Select your unit'
        actions={actions}
        titleStyle={customTitleStyle}
        open={show}
        repositionOnUpdate
        contentStyle={{
          width: '90%',
          height: '90%'
        }}
        bodyStyle={customBodyStyle}
        actionsContainerStyle={{
          padding: '8px 16px 16px 16px'
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
          <div className='ba b--moon-gray mt1 mb2 br1 pv1 flex items-center'>
            <FontIcon className={'material-icons ml1'} style={closeDialogButtonStyle}>
              search
            </FontIcon>
            <TextField
              hintText='Unit names'
              underlineShow={false}
              fullWidth
              value={searchText}
              onChange={(evt) => this.onSearchChanged(evt.target.value)}
              style={{ paddingLeft: '0.5rem', height: '24px' }}
              hintStyle={{ bottom: '0px' }}
            />
          </div>
        </div>
        <div className='ba b--moon-gray br1 flex flex-column flex-grow overflow-auto'>
          {units.length ? (
            <div>
              {units.map(({ name, metaData, description, id }) =>
                <div key={name}>
                  <MenuItem
                    innerDivStyle={resetMenuItemDivStyle}
                    onClick={() => onUnitClick(id)}
                    style={{ whiteSpace: 'none' }}
                  >
                    <div className='bt b--very-light-gray br1 w-100 pl2 flex items-center'>
                      <UnitTypeIcon unitType={metaData ? metaData.unitType : ''} />
                      <div className={'ml3 mv2 semi-dark-gray lh-copy flex-grow'}>
                        <div>{(metaData && metaData.displayName) || name}</div>
                      </div>
                    </div>
                  </MenuItem>
                </div>
              )}
            </div>
          ) : (
            !isLoading ? (
              <NoItemMsg item='unit' />
            ) : (
              <div className='flex-grow flex items-center justify-center'>
                <CircularProgress size={80} />
              </div>
            )
          )}
        </div>
      </Dialog>
    )
  }
}

UnitSelectDialog.propTypes = {
  show: PropTypes.bool.isRequired,
  onDismissed: PropTypes.func.isRequired,
  unitList: PropTypes.array,
  unitsError: PropTypes.object
}

let unitsError
export default connect(() => ({
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
