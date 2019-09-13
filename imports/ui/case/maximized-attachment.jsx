// @flow
/* global HTMLElement */
import * as React from 'react'
import CircularProgress from 'material-ui/CircularProgress'
import { panZoomHandler } from '../util/pan-zoom-handler'

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

    const widthRatio = parent.offsetWidth / image.offsetWidth
    const heightRatio = parent.offsetHeight / image.offsetHeight
    const imageScale = widthRatio > heightRatio ? heightRatio : widthRatio

    const initWidth = image.offsetWidth * imageScale
    const initHeight = image.offsetHeight * imageScale
    const imageCurrDims = {
      x: (parent.offsetWidth / 2 - initWidth / 2),
      y: (parent.offsetHeight / 2 - initHeight / 2),
      width: initWidth,
      height: initHeight,
      currScale: 1
    }

    Object.assign(image.style, {
      position: 'absolute',
      left: imageCurrDims.x + 'px',
      top: imageCurrDims.y + 'px',
      width: imageCurrDims.width + 'px',
      height: imageCurrDims.height + 'px'
    })

    panZoomHandler(parent, imageCurrDims, {
      minZoom: 1,
      maxZoom: 4
    }, {
      applyTransform: ({ x, y, scale }) => {
        Object.assign(image.style, {
          left: x + 'px',
          top: y + 'px',
          width: initWidth * scale + 'px',
          height: initHeight * scale + 'px'
        })
      }
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
