import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import AppBar from 'material-ui/AppBar'
import IconButton from 'material-ui/IconButton'
import FontIcon from 'material-ui/FontIcon'
import UneeTIcon from '../components/unee-t-icon'
import Cases from '../../api/cases'

import {
  titleStyle,
  logoIconStyle,
  logoButtonStyle
} from '../components/app-bar.mui-styles'

import {
  unitIconsStyle,
  moreIconColor
} from './case-explorer.mui-styles'

class CaseExplorer extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      caseId: '',
      expandedUnits: []
    }
  }
  handleExpandUnit (evt, unitTitle) {
    evt.preventDefault()
    const { expandedUnits } = this.state
    let stateMutation
    if (expandedUnits.includes(unitTitle)) {
      stateMutation = {
        expandedUnits: expandedUnits.filter(title => title !== unitTitle)
      }
    } else {
      stateMutation = {
        expandedUnits: expandedUnits.concat([unitTitle])
      }
    }
    this.setState(stateMutation)
  }
  render () {
    const { caseList, isLoading } = this.props
    let unitsDict
    if (!isLoading) {
      unitsDict = caseList.reduce((dict, caseItem) => {
        const { product: unitTitle } = caseItem
        const unitCases = dict[unitTitle] = dict[unitTitle] || []
        unitCases.push(caseItem)
        return dict
      }, {})
    }
    return (
      <div className='flex flex-column full-height roboto overflow-hidden'>
        <AppBar title='Cases' titleStyle={titleStyle}
          iconElementLeft={
            <IconButton iconStyle={logoIconStyle} style={logoButtonStyle}>
              <UneeTIcon />
            </IconButton>
          }
          iconElementRight={
            <div>
              <IconButton>
                <FontIcon className='material-icons' color='white'>search</FontIcon>
              </IconButton>
              <IconButton>
                <FontIcon className='material-icons' color='white'>notifications</FontIcon>
              </IconButton>
            </div>
          }
        />
        {!isLoading && (
          <div className='bb b--black-10'>
            {Object.keys(unitsDict).map(unitTitle => {
              const isExpanded = this.state.expandedUnits.includes(unitTitle)
              return (
                <div key={unitTitle}>
                  <div className='flex items-center h3 bt b--light-gray'
                    onClick={evt => this.handleExpandUnit(evt, unitTitle)}>
                    <FontIcon className='material-icons mh3' style={unitIconsStyle}>home</FontIcon>
                    <div className='flex-grow ellipsis mid-gray'>
                      {unitTitle}
                    </div>
                    <FontIcon className={'material-icons mr2 pr1' + (isExpanded ? ' rotate-90' : '')}
                      style={unitIconsStyle}>
                      keyboard_arrow_right
                    </FontIcon>
                  </div>
                  {isExpanded && (
                    <ul className='list bg-light-gray ma0 pl0 shadow-in-top-1'>
                      {unitsDict[unitTitle].map(caseItem => (
                        <li key={caseItem.id} className='h2-5 bt b--black-10'>
                          <div className='flex items-center'>
                            <Link className='link flex-grow ellipsis bondi-blue ml3 pl1' to={`/case/${caseItem.id}`}>
                              {caseItem.summary}
                            </Link>
                            <IconButton>
                              <FontIcon className='material-icons mr3' color={moreIconColor}>more_horiz</FontIcon>
                            </IconButton>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }
}

CaseExplorer.propTypes = {
  caseList: PropTypes.array,
  isLoading: PropTypes.bool,
  casesError: PropTypes.object
}
let casesError
export default connect(
  () => ({}) // map redux state to props
)(createContainer(() => { // map meteor state to props
  const casesHandle = Meteor.subscribe('myCases', {
    onStop: (error) => {
      casesError = error
    }
  })
  return {
    caseList: Cases.find().fetch(),
    isLoading: !casesHandle.ready(),
    casesError
  }
}, CaseExplorer))
