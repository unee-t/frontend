// @flow
/* global HTMLElement, MouseEvent, WheelEvent */
import * as React from 'react'
import Hammer from 'hammerjs'
import CircularProgress from 'material-ui/CircularProgress'

type Props = {
  attachmentUrl: string
}
type State = {
  isImageLoaded: boolean
}
export default class MaximizedAttachment extends React.Component<Props, State> {
  imageContainer: ?HTMLElement

  state = {
    isImageLoaded: false
  }

  handleImageLoaded = () => {
    this.setState({
      isImageLoaded: true
    })

    if (!this.imageContainer) return

    const image = this.imageContainer
    const parent:HTMLElement = (image.parentElement:any)
    const ham = new Hammer(parent)
    ham.get('pan').set({ direction: Hammer.DIRECTION_ALL })
    ham.get('pinch').set({ enable: true })

    const widthRatio = parent.offsetWidth / image.offsetWidth
    const heightRatio = parent.offsetHeight / image.offsetHeight
    const imageScale = widthRatio > heightRatio ? heightRatio : widthRatio

    const newWidth = image.offsetWidth * imageScale
    const newHeight = image.offsetHeight * imageScale
    const imageCurrDims = {
      x: (parent.offsetWidth / 2 - newWidth / 2),
      y: (parent.offsetHeight / 2 - newHeight / 2),
      width: newWidth,
      height: newHeight,
      currScale: 1
    }
    Object.assign(image.style, {
      position: 'absolute',
      left: imageCurrDims.x + 'px',
      top: imageCurrDims.y + 'px',
      width: imageCurrDims.width + 'px',
      height: imageCurrDims.height + 'px'
    })
    const handleMove = (dx, dy, isFinal) => {
      const newX = imageCurrDims.x + dx
      const newY = imageCurrDims.y + dy
      Object.assign(image.style, {
        left: newX + 'px',
        top: newY + 'px'
      })
      if (isFinal) {
        Object.assign(imageCurrDims, {
          x: newX,
          y: newY
        })
      }
    }
    const calcScalePosition = (scale) => {
      const newWidth = imageCurrDims.width * scale
      const newHeight = imageCurrDims.height * scale

      return {
        width: newWidth,
        height: newHeight,
        x: imageCurrDims.x - (newWidth - imageCurrDims.width) * offsetRates.horizontal,
        y: imageCurrDims.y - (newHeight - imageCurrDims.height) * offsetRates.vertical
      }
    }
    let pinchStart = { x: 0, y: 0 }
    let offsetRates = { horizontal: 0, vertical: 0 }
    let isPinching = false
    let debounceTimeout
    const handleZoom = (center, scale) => {
      if (!isPinching) {
        pinchStart = center
        offsetRates = {
          horizontal: ((pinchStart.x - imageCurrDims.x) / imageCurrDims.width),
          vertical: ((pinchStart.y - imageCurrDims.y) / imageCurrDims.height)
        }
      }
      isPinching = true
      const { width, height, x, y } = calcScalePosition(scale)
      Object.assign(image.style, {
        width: width + 'px',
        height: height + 'px',
        left: (x + center.x - pinchStart.x) + 'px',
        top: (y + center.y - pinchStart.y) + 'px'
      })
    }

    const handleZoomEnd = (center, scale, doDebounce = true) => {
      const { width, height, x, y } = calcScalePosition(scale)
      Object.assign(imageCurrDims, {
        x: x + center.x - pinchStart.x,
        y: y + center.y - pinchStart.y,
        width,
        height
      })

      if (doDebounce) {
        if (debounceTimeout) {
          clearTimeout(debounceTimeout)
        }

        debounceTimeout = setTimeout(() => {
          isPinching = false
          debounceTimeout = null
        }, 100)
      } else {
        isPinching = false
      }
    }

    ham.on('pinch', evt => handleZoom(evt.center, evt.scale))
    ham.on('pinchend', evt => handleZoomEnd(evt.center, evt.scale))
    ham.on('pan', ev => {
      if (!isPinching) {
        handleMove(ev.deltaX, ev.deltaY, ev.isFinal)
      }
    })
    parent.addEventListener('mousedown', (evt: MouseEvent) => evt.preventDefault())
    parent.addEventListener('wheel', (evt: WheelEvent) => {
      const newScale = imageCurrDims.currScale * (1 - evt.deltaY / 1000)
      const evtCenter = { x: evt.clientX, y: evt.clientY }
      handleZoom(evtCenter, newScale)
      handleZoomEnd(evtCenter, newScale, false)
    })
  }
  render () {
    const { attachmentUrl } = this.props
    const { isImageLoaded } = this.state
    return (
      <div className='flex items-center full-height roboto bg-black overflow-hidden relative'>
        <div ref={el => { this.imageContainer = el }}>
          <img
            onLoad={this.handleImageLoaded}
            src={attachmentUrl}
            alt='Image failed to load'
            className={'w-100 obj-contain transition-o-filter ' + (!isImageLoaded ? 'o-0 blur-1' : 'o-100')}
          />
          {!isImageLoaded && (
            <div className='absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center'>
              <CircularProgress size={70} thickness={5} />
            </div>
          )}
        </div>
      </div>
    )
  }
}
