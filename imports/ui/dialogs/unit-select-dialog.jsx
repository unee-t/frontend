import React, { Component } from 'react'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import PropTypes from 'prop-types'
import Dialog from 'material-ui/Dialog'
import { push } from 'react-router-redux'
import FontIcon from 'material-ui/FontIcon'
import { modalTitleStyle, closeDialogButtonStyle } from './generic-dialog.mui-styles'
import UnitTypeIcon from '../unit-explorer/unit-type-icon'
import MenuItem from 'material-ui/MenuItem'
import { resetMenuItemDivStyle } from '../general.mui-styles'
// import CreateReportDialog from '../dialogs/create-report-dialog'
import { Link } from 'react-router-dom'
import { Meteor } from 'meteor/meteor'
import Units, { collectionName } from '../../api/units'
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
    const { show, onDismissed, inProgress, dispatch, unitList, item } = this.props
    const { searchText, searchMode, searchResult, unitId } = this.state
    const units = searchMode ? searchResult : unitList
    const title =
      <div>
        <div className='pb1'>Select units</div>
        <span className='ba b--moon-gray mv1 br1 pv1'>
          <span className='ml2 absolute left-1' style={{marginTop: '0.75rem'}}>
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
            style={{paddingLeft: '2rem'}}
            inputStyle={{padding: '0.3rem'}}
          />
        </span>
      </div>

    const actions =
      <div>
        <div className='bondi-blue tc pa2' onClick={() => dispatch(push(`/unit/new`))} >
          <span> Add a new unit </span>
        </div>
        <div className='ph3'>
          <RaisedButton
            fullWidth
            backgroundColor='var(--bondi-blue)'
            type='submit'
            disabled={unitId === null}
          >
            {this.props.item === 'Report' &&
              <Link className='white f4' to={{pathname: `/unit/${unitId}/reports/new`,
                state: { prevPath: this.props.location.pathname }}}>
                Create {item}
              </Link>
            }
            {item === 'Case' &&
              <Link className='white f4 link' to={{pathname: `/case/new?unit=${unitId}`,
                state: { prevPath: this.props.location.pathname }}}>
                Create {item}
              </Link>
            }
          </RaisedButton>
        </div>
      </div>

    return (
      <Dialog
        title={title}
        actions={actions}
        titleStyle={modalTitleStyle}
        open={show}
        autoDetectWindowHeight
        autoScrollBodyContent
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
            className='button b--none bg-transparent absolute top-1 pt2 right-1 outline-0'
          >
            <FontIcon className='material-icons' style={closeDialogButtonStyle}>close</FontIcon>
          </button>
        )}
        <div className='ba b--moon-gray pa2 br1'>
          {units.map(({ name, metaData, description, id }) =>
            <div key={name}>
              <MenuItem innerDivStyle={resetMenuItemDivStyle}
                onClick={() => this.setState({unitId: id})}
                style={{whiteSpace: 'none', backgroundColor: unitId === id ? 'var(--very-light-gray)' : ''}}
              >
                <div className='bb b--very-light-gray br1 w-100 flex items-center'>
                  <UnitTypeIcon metaData={metaData} />
                  <div className={'ml3 mv1 semi-dark-gray lh-copy flex-grow'}>
                    <div>{(metaData && metaData.displayName) || name}</div>
                  </div>
                </div>
              </MenuItem>
            </div>
          )}
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
