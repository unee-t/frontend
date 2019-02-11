/* global requestAnimationFrame */
import React, { PureComponent } from 'react'
import UnitTypeIcon from '../unit-explorer/unit-type-icon'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { NoItemMsg } from './no-item-msg'

const UNIT_ROW_LIMIT = 25 // How many rows to render at a time - too low shows rendering occur in view, too high is slower
const UNIT_ROW_HEIGHT = 64 // The height of a rendered unit row in pixels
const ITEM_ROW_HEIGHT = 48 // The height of a rendered sub-item row in pixels

// Using "PureComponent" to prevent unnecessary re-renders
export class UnitGroupList extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      expandedUnits: [],
      viewedData: []
    }
    this.calculatedHeights = {}
  }

  handleExpandUnit (evt, { unitTitle, bzId, items }) {
    evt.preventDefault()
    const { expandedUnits } = this.state
    let stateMutation
    if (expandedUnits.includes(unitTitle)) {
      stateMutation = {
        expandedUnits: expandedUnits.filter(title => title !== unitTitle)
      }
      this.calculatedHeights[bzId] = UNIT_ROW_HEIGHT
    } else {
      stateMutation = {
        expandedUnits: expandedUnits.concat([unitTitle])
      }
      this.calculatedHeights[bzId] = UNIT_ROW_HEIGHT + (items.length * ITEM_ROW_HEIGHT)
    }
    this.setState(stateMutation)
  }

  handleScroll = (() => {
    let nextFrameRequested = false
    const SCROLL_PADDING = 150
    return evt => {
      const scroller = evt.target
      if (!nextFrameRequested) {
        requestAnimationFrame(() => { // The scroll event triggers too often, so throttling is done based on the browser's FPS rate
          nextFrameRequested = false // releasing the lock for the next scroll event to queue render on the next frame

          const { unitGroupList } = this.props
          if (!unitGroupList.length) return

          // Checking if scrolling close enough to the sensitivity bounds has occurred
          if ((scroller.scrollTop < this.beforeHeight + SCROLL_PADDING) ||
            (scroller.scrollTop + scroller.offsetHeight > this.beforeHeight + this.viewedHeight - SCROLL_PADDING)) {
            // Finding the minimal allowed "dead space" above the current scroll position
            let requestedBeforeHeight = scroller.scrollTop - (SCROLL_PADDING * 2)
            requestedBeforeHeight = requestedBeforeHeight > 0 ? requestedBeforeHeight : 0

            // Setting the approximate "before" height before the minor adjustments
            this.beforeHeight = requestedBeforeHeight

            // Finding the first row index that should be rendered for the current scroll position
            let rowIndex = 0
            // "As long as the current row's height doesn't exceed the remainder"
            while (requestedBeforeHeight - this.calculatedHeights[unitGroupList[rowIndex].bzId.toString()] > 0) {
              // Subtracting the current row's height from the remainder
              requestedBeforeHeight -= this.calculatedHeights[unitGroupList[rowIndex].bzId.toString()]
              // Counting to the next row
              rowIndex++
            }

            // "requestedBeforeHeight" now contains the remainder of a partial row height or 0, the exact "before" height is adjusted using it
            this.beforeHeight -= requestedBeforeHeight

            // Getting a slice of the data starting from the start index found above to the top of the range needed
            const viewedData = unitGroupList.slice(rowIndex, rowIndex + UNIT_ROW_LIMIT)

            // Calculating the requested rows to render's height for the next bounds check
            this.viewedHeight = this.calcHeightForData(viewedData)

            // Calculating the height of all the rows below the current range
            this.afterHeight = this.calcHeightForData(unitGroupList.slice(rowIndex + UNIT_ROW_LIMIT))

            // Setting the calculated "dead spaces" above and below as padding to properly position the rendered rows in the scrolling context
            Object.assign(this.paddingEl.style, {
              paddingTop: this.beforeHeight + 'px',
              paddingBottom: this.afterHeight + 'px'
            })

            this.setState({
              viewedData
            })
          }
        })
        nextFrameRequested = true
      }
    }
  })()

  calcHeightForData = data => {
    return data.reduce((sum, d) => {
      return sum + this.calculatedHeights[d.bzId.toString()]
    }, 0)
  }

  handleDataUpdated = unitGroupList => {
    this.scrollerEl.scrollTop = 0
    this.afterHeight = 0
    this.beforeHeight = 0
    if (unitGroupList.length) {
      unitGroupList.forEach((item, idx) => {
        const strId = item.bzId.toString()
        if (!this.calculatedHeights[strId]) {
          this.calculatedHeights[strId] = UNIT_ROW_HEIGHT
        }

        if (idx >= UNIT_ROW_LIMIT) {
          this.afterHeight += this.calculatedHeights[strId]
        }
      })

      this.paddingEl.style.paddingBottom = this.afterHeight + 'px'
      const viewedData = unitGroupList.slice(0, UNIT_ROW_LIMIT)
      this.viewedHeight = this.calcHeightForData(viewedData)
      this.setState({
        viewedData
      })
    } else {
      this.viewedHeight = 0
      this.setState({
        viewedData: []
      })
    }
  }

  componentDidMount () {
    this.handleDataUpdated(this.props.unitGroupList)
  }

  componentDidUpdate (prevProps) {
    if (prevProps.unitGroupList !== this.props.unitGroupList) {
      this.handleDataUpdated(this.props.unitGroupList)
    }
  }

  render () {
    const { unitGroupList, itemType, expandedListRenderer, creationUrlGenerator, noItemsIconType } = this.props
    const { expandedUnits, viewedData } = this.state
    const isExpanded = (unitTitle) => expandedUnits.includes(unitTitle)

    return (
      <div
        onScroll={this.handleScroll} ref={el => { this.scrollerEl = el }}
        className='bb b--black-10 overflow-auto flex-grow flex flex-column bg-very-light-gray pb6'
      >
        {unitGroupList.length ? (
          <div className='flex flex-column no-shrink' ref={el => { this.paddingEl = el }}>
            {viewedData.map(unitItem => {
              const { unitTitle, unitType, bzId, items, hasUnread, isActive } = unitItem
              return (
                <div key={unitTitle}>
                  <div className='flex items-center h3 bt b--light-gray bg-white'
                    onClick={evt => this.handleExpandUnit(evt, unitItem)}
                  >
                    <div className='mh3'>
                      <UnitTypeIcon unitType={unitType} />
                    </div>
                    <div className='flex-grow ellipsis mid-gray mr4'>
                      {unitTitle}
                      <div className='flex justify-space'>
                        <div className={'f6 silver mt1' + (hasUnread ? ' b' : '')}>
                          <span>{items.length} { items.length > 1 ? itemType + 's' : itemType }</span>
                        </div>
                        {!isActive
                          ? (
                            <div className='no-shrink flex items-center br2 bg-silver'>
                              <div className='f7 pa1 white'>Unit Disabled</div>
                            </div>
                          )
                          : bzId && (
                            <div className='no-shrink flex items-center'>
                              <Link
                                className='f6 link ellipsis ml3 pl1 mv1 bondi-blue fw5'
                                to={creationUrlGenerator(bzId)}>
                                Add {itemType}
                              </Link>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                  {isExpanded(unitTitle) && (
                    <ul className='list bg-light-gray ma0 pl0 shadow-in-top-1'>
                      {expandedListRenderer({
                        allItems: items
                      })}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        )
          : (<NoItemMsg item={itemType} iconType={noItemsIconType} buttonOption />)
        }
      </div>
    )
  }
}

UnitGroupList.propTypes = {
  unitGroupList: PropTypes.array.isRequired,
  itemType: PropTypes.string.isRequired,
  expandedListRenderer: PropTypes.func.isRequired,
  creationUrlGenerator: PropTypes.func.isRequired,
  noItemsIconType: PropTypes.string.isRequired
}
