// @flow
/* global HTMLElement, MouseEvent, WheelEvent, requestAnimationFrame, cancelAnimationFrame */

import Hammer from 'hammerjs'

type ImageDimms = {
  x: number,
  y: number,
  width: number,
  height: number,
  currScale: number
}

type Callbacks = {
  applyTransform: ({ x: number, y: number, scale: number }) => void,
  onEngaged?: () => void
}

type Options = {
  disableNormalPan?: boolean
}

export const panZoomHandler = (
  element: HTMLElement,
  imageCurrDims: ImageDimms,
  { minZoom, maxZoom }: { minZoom: number, maxZoom: number },
  { applyTransform, onEngaged = () => {} }: Callbacks,
  { disableNormalPan = false }: Options = {}
) => {
  const ham = new Hammer(element)
  ham.get('pan').set({ direction: Hammer.DIRECTION_ALL })
  ham.get('pinch').set({ enable: true })

  const boundsCheck = ({ targetX, targetY, width, height }) => {
    let constrainedX = targetX
    let constrainedY = targetY

    let rightBound, leftBound
    if (element.offsetWidth >= width) {
      rightBound = element.offsetWidth - width
      leftBound = 0
    } else {
      rightBound = 0
      leftBound = element.offsetWidth - width
    }
    if (constrainedX > rightBound) constrainedX = rightBound
    if (constrainedX < leftBound) constrainedX = leftBound

    let bottomBound, topBound
    if (element.offsetHeight >= height) {
      bottomBound = element.offsetHeight - height
      topBound = 0
    } else {
      bottomBound = 0
      topBound = element.offsetHeight - height
    }
    if (constrainedY > bottomBound) constrainedY = bottomBound
    if (constrainedY < topBound) constrainedY = topBound

    return { constrainedX, constrainedY }
  }

  let inertiaAnimFrame
  let lastDiffDx = 0
  let lastDiffDy = 0
  let lastDx = 0
  let lastDy = 0
  const handleMove = (dx, dy, isFinal) => {
    if (!isFinal) {
      onEngaged()
      if (inertiaAnimFrame) {
        cancelAnimationFrame(inertiaAnimFrame)
        inertiaAnimFrame = null
      }
    }

    const { constrainedX, constrainedY } = boundsCheck({
      targetX: imageCurrDims.x + dx,
      targetY: imageCurrDims.y + dy,
      width: imageCurrDims.width,
      height: imageCurrDims.height
    })

    applyTransform({ x: constrainedX, y: constrainedY, scale: imageCurrDims.currScale })

    if (isFinal) {
      Object.assign(imageCurrDims, {
        x: constrainedX,
        y: constrainedY
      })

      if (Math.abs(lastDiffDx) > 2 || Math.abs(lastDiffDy) > 2) {
        lastDiffDx *= 0.7
        lastDiffDy *= 0.7
        inertiaAnimFrame = requestAnimationFrame(() => {
          handleMove(lastDiffDx, lastDiffDy, true)
        })
      }
    } else {
      lastDiffDx = dx - lastDx
      lastDiffDy = dy - lastDy
      lastDx = dx
      lastDy = dy
    }
  }
  const calcScalePosition = (scale) => {
    let newScale = imageCurrDims.currScale * scale
    if (newScale > maxZoom) newScale = maxZoom
    if (newScale < minZoom) newScale = minZoom
    scale = newScale / imageCurrDims.currScale
    const newWidth = imageCurrDims.width * scale
    const newHeight = imageCurrDims.height * scale

    return {
      width: newWidth,
      height: newHeight,
      x: imageCurrDims.x - (newWidth - imageCurrDims.width) * offsetRates.horizontal,
      y: imageCurrDims.y - (newHeight - imageCurrDims.height) * offsetRates.vertical,
      currScale: newScale
    }
  }
  let pinchStart = { x: 0, y: 0 }
  let offsetRates = { horizontal: 0, vertical: 0 }
  let isPinching = false
  let debounceTimeout
  const handleZoom = (center, scale) => {
    onEngaged()
    if (!isPinching) {
      pinchStart = center
      offsetRates = {
        horizontal: ((pinchStart.x - imageCurrDims.x) / imageCurrDims.width),
        vertical: ((pinchStart.y - imageCurrDims.y) / imageCurrDims.height)
      }
    }

    isPinching = true
    const { x, y, currScale, width, height } = calcScalePosition(scale)
    const { constrainedX, constrainedY } = boundsCheck({
      targetX: x + center.x - pinchStart.x,
      targetY: y + center.y - pinchStart.y,
      width,
      height
    })
    applyTransform({
      x: constrainedX,
      y: constrainedY,
      scale: currScale
    })
  }

  const handleZoomEnd = (center, scale, doDebounce = true) => {
    const { width, height, x, y, currScale } = calcScalePosition(scale)
    const { constrainedX, constrainedY } = boundsCheck({
      targetX: x + center.x - pinchStart.x,
      targetY: y + center.y - pinchStart.y,
      width,
      height
    })
    Object.assign(imageCurrDims, {
      x: constrainedX,
      y: constrainedY,
      width,
      height,
      currScale
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
  if (!disableNormalPan) {
    ham.on('pan', ev => {
      if (!isPinching) {
        handleMove(ev.deltaX, ev.deltaY, ev.isFinal)
      }
    })
    element.addEventListener('mousedown', (evt: MouseEvent) => evt.preventDefault())
  }
  element.addEventListener('wheel', (evt: WheelEvent) => {
    evt.preventDefault()

    // Normalized value to make it look more consistent across different browsers
    const normDelta = Math.sign(evt.deltaY) * Math.min(Math.abs(evt.deltaY), 4)
    const newScale = 1 - normDelta / 100
    const boundingRect = element.getBoundingClientRect()
    const evtCenter = { x: evt.clientX - boundingRect.left, y: evt.clientY - boundingRect.top }
    handleZoom(evtCenter, newScale)
    handleZoomEnd(evtCenter, newScale, false)
  })
}
