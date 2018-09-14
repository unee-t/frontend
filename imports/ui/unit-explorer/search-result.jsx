import React, { Component } from 'react'
import MenuItem from 'material-ui/MenuItem'
// import UnitTypeIcon from './unit-type-icon'
import { resetMenuItemDivStyle } from '../general.mui-styles'

export default class SearchResult extends Component {
  constructor (props) {
    super(props)
    this.state = {
      ready: false
    }
  }

  componentDidUpdate (prevProps) {
    const { unitsFound } = this.props
    if (prevProps.unitsFound.length !== unitsFound.length) {
      this.setState({ready: true})
    }
  }

  render () {
    const { ready } = this.state
    const { unitsFound } = this.props
    return (
      <div className='flex-grow flex flex-column overflow-hidden'>
        { ready && unitsFound.map(({ id, name, description, metaData }) => (
          <MenuItem key={id}
            innerDivStyle={resetMenuItemDivStyle}
            // onClick={() => handleUnitClicked(id)}
          >
            <div className='mt2 ph2 bb b--very-light-gray br1 w-100 flex items-center pa2'>
              {/* <UnitTypeIcon searchResult={metaData} /> */}
              <div className='ml3 mv1 semi-dark-gray lh-copy flex-grow overflow-hidden'>
                <div className='ti1 ellipsis'>{name}</div>
                <div className='ti1 ellipsis silver'>{description}&nbsp;</div>
              </div>
            </div>
          </MenuItem>
        ))
        }
      </div>
    )
  }
}
