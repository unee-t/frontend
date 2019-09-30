// @flow
/* global HTMLElement, SyntheticMouseEvent */
import * as React from 'react'
import randToken from 'rand-token'
import { panZoomHandler } from '../util/pan-zoom-handler'
import FontIcon from 'material-ui/FontIcon'
type Pins = Array<{
  x: number,
  y: number,
  id: string
}>
type Props = {
  isEditing?: boolean,
  isMovable?: boolean,
  pins: Pins,
  floorPlan: {
    url: string,
    dimensions: {
      width: number,
      height: number
    }
  },
  onPinsChanged?: (pins: Pins) => void
}

type State = {
  isFloorPlanLoaded: boolean
}

export default class FloorPlanEditor extends React.Component<Props, State> {
  floorPlanContainer: ?HTMLElement = null
  imageEl: ?HTMLElement = null
  imageCurrDims = {}
  floorPlanPinMap = {}
  state = {
    isFloorPlanLoaded: false
  }
  handleFloorPlanContainerClicked = (evt: SyntheticMouseEvent<HTMLElement>) => {
    const { isEditing, pins, onPinsChanged } = this.props
    if (isEditing && onPinsChanged && this.floorPlanContainer) {
      const boundingRect = this.floorPlanContainer.getBoundingClientRect()
      const relMousePos = { x: evt.clientX - boundingRect.left, y: evt.clientY - boundingRect.top }
      const newPin = {
        x: (relMousePos.x - this.imageCurrDims.x) / (this.imageCurrDims.currScale * this.imageCurrDims.initScale),
        y: (relMousePos.y - this.imageCurrDims.y) / (this.imageCurrDims.currScale * this.imageCurrDims.initScale),
        id: randToken.generate(12)
      }
      onPinsChanged(pins.concat([newPin]))
    }
  }

  handleFloorPlanImageLoaded = () => {
    const { floorPlan, isMovable } = this.props
    const image = this.imageEl
    if (!image) return
    const parent:HTMLElement = (image.parentElement:any)

    const parWidth = parent.offsetWidth
    const parHeight = parent.offsetHeight

    const widthRatio = parWidth / image.offsetWidth
    const heightRatio = parHeight / image.offsetHeight
    const imageScale = widthRatio > heightRatio ? heightRatio : widthRatio

    const initWidth = image.offsetWidth * imageScale
    const initHeight = image.offsetHeight * imageScale

    const initScale = initWidth / floorPlan.dimensions.width
    const imageX = (parWidth / 2 - initWidth / 2)
    const imageY = (parHeight / 2 - initHeight / 2)
    const imageCurrDims = this.imageCurrDims = {
      x: imageX,
      y: imageY,
      width: initWidth,
      height: initHeight,
      currScale: 1,
      initScale
    }

    Object.assign(image.style, {
      position: 'absolute',
      left: imageX + 'px',
      top: imageY + 'px',
      width: initWidth + 'px',
      height: initHeight + 'px'
    })

    this.setState({
      isFloorPlanLoaded: true
    })

    if (isMovable) {
      panZoomHandler(parent, imageCurrDims, {
        minZoom: 1,
        maxZoom: 3
      }, {
        applyTransform: ({ x, y, scale }) => {
          Object.assign(image.style, {
            left: x + 'px',
            top: y + 'px',
            width: initWidth * scale + 'px',
            height: initHeight * scale + 'px'
          })

          const { pins } = this.props

          pins.forEach(obj => {
            const el = this.floorPlanPinMap[obj.id]

            Object.assign(el.style, {
              left: (x + (obj.x * scale * initScale) - 12) + 'px',
              top: (y + (obj.y * scale * initScale) - 20) + 'px'
            })
          })
        }
      })
    }
  }

  render () {
    const { floorPlan, pins, isEditing, onPinsChanged } = this.props
    const { isFloorPlanLoaded } = this.state
    return (
      <div className='overflow-hidden h5 relative w-100' onDoubleClick={this.handleFloorPlanContainerClicked} ref={el => { this.floorPlanContainer = el }}>
        {floorPlan && (
          <img className='w-100 obj-contain'
            src={floorPlan.url}
            alt={floorPlan.url}
            ref={ref => { this.imageEl = ref }}
            onLoad={() => this.handleFloorPlanImageLoaded()}
          />
        )}
        {isFloorPlanLoaded && pins.map(pin => (
          <div key={pin.id} className='absolute' ref={el => { this.floorPlanPinMap[pin.id] = el }} style={{
            left: (this.imageCurrDims.x + (pin.x * this.imageCurrDims.currScale * this.imageCurrDims.initScale) - 12) + 'px',
            top: (this.imageCurrDims.y + (pin.y * this.imageCurrDims.currScale * this.imageCurrDims.initScale) - 20) + 'px'
          }} onClick={isEditing && onPinsChanged && (() => {
            delete this.floorPlanPinMap[pin.id]
            const modifiedList = pins.filter(p => p.id !== pin.id)
            onPinsChanged(modifiedList)
          })}>
            <FontIcon className='material-icons' color='var(--attention-red)' style={{ fontSize: '28px' }}>room</FontIcon>
          </div>
        ))}
      </div>
    )
  }
}
