import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import * as fa from 'react-icons/fa'
import { fetchLinks } from '..'
import { useHistory } from 'react-router-dom'
import './ImageContent.scss'
import { useRecoilValue, useRecoilState, useSetRecoilState } from 'recoil'
import {
  selectedNodeState,
  selectedAnchorsState,
  selectedExtentState,
  currentNodeState,
  startAnchorState,
  refreshLinkListState,
} from '../../../../global/Atoms'
import { FrontendAnchorGateway } from '../../../../anchors'
import { FrontendNodeGateway } from '../../../../nodes'
import { IAnchor, IImageExtent } from '../../../../types'
import './ImageContent.scss'

// handling resize
class ResizeHandle {
  constructor(width: number, height: number, setCoord: Function) {
    this.onPointerDown = this.onPointerDown.bind(this)
    this.onPointerMove = this.onPointerMove.bind(this)
    this.onPointerUp = this.onPointerUp.bind(this)
    this.onPointerLeave = this.onPointerLeave.bind(this)

    this.setCoord = setCoord

    this.size = { width, height }
    this.changedSize = { width, height }
  }

  setCoord: Function

  start: { x: number; y: number } = { x: 0, y: 0 }

  nowCoord_ = { x: 0, y: 0 }

  size = { width: 0, height: 0 }

  changedSize = { width: 0, height: 0 }

  startMove = false

  set nowCoord(coord: typeof this.nowCoord_) {
    this.nowCoord_ = coord
    this.setCoord(coord)
  }

  onPointerDown(e: any) {
    e.preventDefault()
    e.stopPropagation()

    this.startMove = true
    this.start = { x: e.clientX, y: e.clientY }
    this.nowCoord = { x: e.clientX, y: e.clientY }
  }

  onPointerMove(e: any) {
    if (!this.startMove) return
    const nowX = e.clientX
    const nowY = e.clientY

    this.nowCoord = { x: nowX, y: nowY }

    const incrementX = Math.ceil(nowX - this.start.x)
    const incrementY = Math.ceil(nowY - this.start.y)

    this.changedSize = {
      width: this.size.width + incrementX,
      height: this.size.height + incrementY,
    }

    return {
      width: this.size.width + incrementX,
      height: this.size.height + incrementY,
    }
  }

  onPointerUp(e: any) {
    this.startMove = false
    this.size = this.changedSize
  }

  onPointerLeave(e: any) {
    // this.startMove = false
    // this.size = this.changedSize
  }
}

/** The content of an image node, including any anchors */
export const ImageContent = () => {
  const startAnchor = useRecoilValue(startAnchorState)

  // recoil state management
  const currentNode = useRecoilValue(currentNodeState)
  const refreshLinkList = useRecoilValue(refreshLinkListState)
  const [selectedAnchors, setSelectedAnchors] = useRecoilState(selectedAnchorsState)
  // eslint-disable-next-line
  const [selectedExtent, setSelectedExtent] = useRecoilState(selectedExtentState)
  // eslint-disable-next-line
  const setSelectedNode = useSetRecoilState(selectedNodeState)
  // eslint-disable-next-line
  const [imageAnchor, setImageAnchor] = useState<any>({})

  const [width, setWidth] = useState<number | undefined>(undefined)
  const [height, setHeight] = useState<number | undefined>(undefined)
  const [coord, setCoord] = useState({ x: 0, y: 0 })

  const imageRef = useRef<HTMLImageElement>(null)

  const [initSize, setInitSize] = useState({ width: 0, height: 0 })

  const [scale, setScale] = useState(-1)

  const resizeHandle = useMemo(
    () => new ResizeHandle(width || 0, height || 0, setCoord),
    []
  )

  const content = currentNode.content

  /* State variable to keep track of anchors rendered on image */
  const [imageAnchors, setImageAnchors] = useState<JSX.Element[]>([])
  const [startAnchorVisualization, setStartAnchorVisualization] = useState<JSX.Element>()

  // Indicated whether we are currently dragging the image
  let dragging: boolean = false
  // To store the top of the currently selected region for onPointerMove
  let currentTop: number
  // To store the left of the currently selected region for onPointerMove
  let currentLeft: number
  let xLast: number
  let yLast: number

  /**
   * useRef Here is an example of use ref to store a mutable html object
   * The selection ref is how we can access the selection that we render
   *
   * TODO [Editable]: This is the component that we would want to resize
   */
  const imageContainer = useRef<HTMLHeadingElement>(null)

  /* This is how we can access currently selected region for making links */
  const selection = useRef<HTMLHeadingElement>(null)

  /**
   * State variable to keep track of the currently selected anchor IDs
   * Use: Compare with selectedAnchors to update previous state
   */
  const [selectedAnchorIds, setSelectedAnchorIds] = useState<string[]>([])
  const history = useHistory()

  /**
   * Handle click on anchor that is displayed on image
   * Single click: Select the anchor
   * Double click: Navigate to the opposite node
   */
  const handleAnchorSelect = async (e: React.MouseEvent, anchor: IAnchor) => {
    e.stopPropagation()
    e.preventDefault()
    switch (e.detail) {
      // Left click to set selected anchors
      case 1:
        setSelectedAnchors && setSelectedAnchors([anchor])
        setSelectedExtent(anchor.extent)
        break
      // Double click to navigate to node
      case 2:
        const links = await fetchLinks(anchor.anchorId)
        if (links.length > 0) {
          if (links[0].anchor1Id !== anchor.anchorId) {
            history.push(`/${links[0].anchor1NodeId}/`)
            const anchor1 = await FrontendAnchorGateway.getAnchor(links[0].anchor1Id)
            if (anchor1.success && anchor1.payload) {
              setSelectedAnchors([anchor1.payload])
              setSelectedExtent(anchor1.payload.extent)
            }
          } else if (links[0].anchor2Id !== anchor.anchorId) {
            history.push(`/${links[0].anchor2NodeId}/`)
            const anchor2 = await FrontendAnchorGateway.getAnchor(links[0].anchor2Id)
            if (anchor2.success && anchor2.payload) {
              setSelectedAnchors([anchor2.payload])
              setSelectedExtent(anchor2.payload.extent)
            }
          }
        }
        break
    }
  }

  const displaySelectedAnchors = useCallback(() => {
    selectedAnchorIds.forEach((anchorId) => {
      const prevSelectedAnchor = document.getElementById(anchorId)
      if (prevSelectedAnchor) {
        prevSelectedAnchor.style.backgroundColor = ''
      }
    })
    if (imageContainer.current) {
      imageContainer.current.style.outline = ''
    }
    const newSelectedAnchorIds: string[] = []
    selectedAnchors &&
      selectedAnchors.forEach((anchor) => {
        if (anchor) {
          if (anchor.extent === null && imageContainer.current) {
            imageContainer.current.style.outline = 'solid 5px #d7ecff'
          }
          const anchorElement = document.getElementById(anchor.anchorId)
          if (anchorElement) {
            anchorElement.style.backgroundColor = '#d7ecff'
            anchorElement.style.opacity = '60%'
            newSelectedAnchorIds.push(anchorElement.id)
          }
        }
      })
    setSelectedAnchorIds(newSelectedAnchorIds)
  }, [selectedAnchorIds, selectedAnchors, startAnchor])

  /**
   * To trigger on load and when we setSelectedExtent
   */
  useEffect(() => {
    setSelectedExtent && setSelectedExtent(null)
    if (selection.current) {
      selection.current.style.left = '-50px'
      selection.current.style.top = '-50px'
      selection.current.style.width = '0px'
      selection.current.style.height = '0px'
    }
  }, [setSelectedExtent, refreshLinkList])

  useEffect(() => {
    displaySelectedAnchors()
  }, [selectedAnchors, refreshLinkList])

  useEffect(() => {
    displayImageAnchors()
  }, [selectedAnchors, currentNode, refreshLinkList, startAnchor])

  // set currentNode image height and width
  useEffect(() => {
    if (!currentNode.size) return

    setInitSize({ ...currentNode.size })
    setWidth(currentNode.size.width)
    setHeight(currentNode.size.height)
  }, [currentNode])

  /**
   * onPointerDown initializes the selection
   * @param e
   */
  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragging = true
    // The y location of the image top in the browser
    const imageTop = imageContainer.current?.getBoundingClientRect().top
    // The x location of the image left in the browser
    const imageLeft = imageContainer.current?.getBoundingClientRect().left

    const x = e.clientX // The x location of the pointer in the browser
    const y = e.clientY // The y location of the poitner in the browser
    xLast = e.clientX
    yLast = e.clientY
    if (selection.current && imageLeft && imageTop) {
      selection.current.style.left = String(x - imageLeft) + 'px'
      selection.current.style.top = String(y - imageTop) + 'px'
      currentLeft = x - imageLeft
      currentTop = y - imageTop
      selection.current.style.width = '0px'
      selection.current.style.height = '0px'
    }
  }

  /**
   * onPointerMove resizes the selection
   * @param e
   */
  const onPointerMove = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dragging) {
      const x = e.clientX // The x location of the pointer in the browser
      const y = e.clientY // The y location of the poitner in the browser
      const deltaX = x - xLast // The change in the x location
      const deltaY = y - yLast // The change in the y location
      xLast = e.clientX
      yLast = e.clientY
      if (selection.current) {
        const imageTop = imageContainer.current?.getBoundingClientRect().top
        const imageLeft = imageContainer.current?.getBoundingClientRect().left
        let left = parseFloat(selection.current.style.left)
        let top = parseFloat(selection.current.style.top)
        let width = parseFloat(selection.current.style.width)
        let height = parseFloat(selection.current.style.height)

        // TODO: You may need to change this depending on your screen resolution
        const divider = 1

        // Horizontal dragging
        // Case A: Dragging above start point
        if (imageLeft && x - imageLeft < currentLeft) {
          width -= deltaX / divider
          left += deltaX / divider
          selection.current.style.left = String(left) + 'px'
          // Case B: Dragging below start point
        } else {
          width += deltaX / divider
        }

        // Vertical dragging
        // Case A: Dragging to the left of start point
        if (imageTop && y - imageTop < currentTop) {
          height -= deltaY / divider
          top += deltaY / divider
          selection.current.style.top = String(top) + 'px'
          // Case B: Dragging to the right of start point
        } else {
          height += deltaY / divider
        }

        // Update height and width
        selection.current.style.width = String(width) + 'px'
        selection.current.style.height = String(height) + 'px'
      }
    }

    // handling the resize movement
    if (resizeHandle.startMove) {
      const result = resizeHandle.onPointerMove(e)

      if (!result) return
      const { width, height } = result

      queueMicrotask(() => {
        setWidth(width || 0)
        setHeight(height || 0)
      })
    }
  }

  /**
   * onPointerUp so we have completed making our selection,
   * therefore we should create a new IImageExtent and
   * update the currently selected extent
   * @param e
   */
  const onPointerUp = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragging = false
    if (selection.current) {
      currentTop = 0
      currentLeft = 0
      const extent: IImageExtent = {
        type: 'image',
        height: parseFloat(selection.current.style.height),
        left: parseFloat(selection.current.style.left),
        top: parseFloat(selection.current.style.top),
        width: parseFloat(selection.current.style.width),
      }
      // Check if setSelectedExtent exists, if it does then update it
      if (setSelectedExtent) {
        setSelectedExtent(extent)
      }
    }
  }

  const onHandleClearSelectionClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (setSelectedExtent) {
      setSelectedExtent(null)
      if (selection.current) {
        // Note: This is a rather hacky solution to hide the selected region
        selection.current.style.left = '-50px'
        selection.current.style.top = '-50px'
        selection.current.style.width = '0px'
        selection.current.style.height = '0px'
      }
    }
  }

  useEffect(() => {
    // this code ensures that an extent selected on
    // one node doesn't display on another node
    setSelectedExtent(null)
    if (selection.current) {
      // Note: This is a rather hacky solution to hide the selected region
      selection.current.style.left = '-50px'
      selection.current.style.top = '-50px'
      selection.current.style.width = '0px'
      selection.current.style.height = '0px'
    }
    // this code visualizes the start anchor
    if (
      startAnchor != null &&
      startAnchor != undefined &&
      startAnchor.nodeId == currentNode.nodeId &&
      startAnchor.extent?.type == 'image'
    ) {
      setStartAnchorVisualization(
        <div
          id={'startAnchor'}
          key={'image.startAnchor'}
          className="image-anchor"
          onPointerDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          style={{
            height: startAnchor.extent?.height,
            left: startAnchor.extent.left,
            top: startAnchor.extent.top,
            width: startAnchor.extent.width,
          }}
        />
      )
    } else {
      setStartAnchorVisualization(<div></div>)
    }
  }, [currentNode, startAnchor])

  /**
   * This method displays the existing anchors. We are fetching them from
   * the data with a call to FrontendAnchorGateway.getAnchorsByNodeId
   * which returns a list of IAnchors that are on currentNode
   */
  const displayImageAnchors = async (): Promise<void> => {
    const anchorsFromNode = await FrontendAnchorGateway.getAnchorsByNodeId(
      currentNode.nodeId
    )

    if (!(anchorsFromNode.success && anchorsFromNode.payload)) return

    const anchorElementList: JSX.Element[] = []
    // List of anchor elements to return
    const imageAnchors = anchorsFromNode.payload
    // IAnchor array from FrontendAnchorGateway call
    imageAnchors.forEach((anchor) => {
      // Checking that the extent is of type image to access IImageExtent
      if (anchor.extent?.type == 'image') {
        if (
          !(
            startAnchor &&
            startAnchor.extent?.type == 'image' &&
            startAnchor == anchor &&
            startAnchor.nodeId == currentNode.nodeId
          )
        ) {
          anchorElementList.push(
            <div
              id={anchor.anchorId}
              key={'image.' + anchor.anchorId}
              className="image-anchor"
              onClick={(e) => {
                handleAnchorSelect(e, anchor)
              }}
              onPointerDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              style={{
                height: anchor.extent.height,
                left: anchor.extent.left,
                top: anchor.extent.top,
                width: anchor.extent.width,
              }}
            />
          )
        }
      }
    })
    if (
      startAnchor &&
      startAnchor.extent?.type == 'image' &&
      startAnchor.nodeId == currentNode.nodeId
    ) {
      anchorElementList.push(
        <div
          id={startAnchor.anchorId}
          key={'image.startAnchor' + startAnchor.anchorId}
          className="image-startAnchor"
          style={{
            height: startAnchor.extent.height,
            left: startAnchor.extent.left,
            top: startAnchor.extent.top,
            width: startAnchor.extent.width,
          }}
        />
      )
    }

    setImageAnchors(anchorElementList)
  }

  // onWidthChange
  const onWidthChange = (e: any) => {
    const value = Number(e?.target?.value)

    if (!value || value < 0 || Number.isNaN(value)) return

    setWidth(value)
  }

  const onHeightChange = (e: any) => {
    const value = Number(e?.target?.value)

    if (!value || value < 0 || Number.isNaN(value)) return

    setHeight(value)
  }

  const onLoad = (e: any) => {
    const width = e.target.clientWidth as number
    const height = e.target.clientHeight as number

    setHeight(height)
    setWidth(width)

    resizeHandle.size = { width, height }

    if (!initSize.width && !initSize.height) {
      setInitSize({ width, height })
    }
  }

  const fixStyle = { position: 'fixed', top: coord.y - 10, left: coord.x - 10 } as any

  const onReset = () => {
    setHeight(initSize.height)
    setWidth(initSize.width)

    resizeHandle.size = { width: initSize.width, height: initSize.height }
    saveSize()
  }

  const saveSize = async () => {
    const payload = {
      fieldName: 'size',
      value: { width: width || -1, height: height || -1 },
    }

    await FrontendNodeGateway.updateNode(currentNode.nodeId, [payload as any])
  }

  const pointerUpWithSave = async (e: any) => {
    resizeHandle.onPointerUp(e)
    saveSize()
  }

  // handling on scale change <- for capstone
  const onScaleChange = (e: any) => {
    const scale = e.target.value

    setScale(e.target.value)

    if (!imageRef || !imageRef.current) return

    // natural size
    const naturalWidth = imageRef.current.naturalWidth
    const naturalHeight = imageRef.current.naturalHeight

    const scaleWitdh = Math.floor(naturalWidth * scale)
    const scaleHeight = Math.floor(naturalHeight * scale)

    setWidth(scaleWitdh)
    setHeight(scaleHeight)

    resizeHandle.changedSize = { width: scaleWitdh, height: scaleHeight }
  }

  // return jsx
  return (
    <div
      className="imageWrapper"
      onPointerMove={resizeHandle.onPointerMove}
      onMouseUp={pointerUpWithSave}
    >
      <div className="operation-wrapper">
        <button className="design-btn" onClick={onReset}>
          reset
        </button>
        <input
          className="design-input"
          type="number"
          onChange={onWidthChange}
          value={width}
        />
        <input
          className="design-input"
          type="number"
          onChange={onHeightChange}
          value={height}
        />
      </div>

      <div className="operation-scale">
        <span>scale:</span>
        <span className="operation-scale-range">
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.01"
            value={scale}
            onChange={onScaleChange}
          />
        </span>
        <span>{scale}</span>
      </div>
      <div
        ref={imageContainer}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerMove={onPointerMove}
        className="imageContent-wrapper"
      >
        {startAnchorVisualization}
        {imageAnchors}
        {
          <div className="selection" ref={selection}>
            <div
              onClick={onHandleClearSelectionClick}
              onPointerDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              className="selection-close"
            >
              <fa.FaTimes />
            </div>
          </div>
        }
        <span
          className="resize-handle"
          onPointerDown={resizeHandle.onPointerDown}
          onPointerUp={pointerUpWithSave}
          onPointerLeave={resizeHandle.onPointerLeave}
          style={resizeHandle.startMove ? fixStyle : ({} as any)}
        />
        <img src={content} onLoad={onLoad} style={{ width, height }} ref={imageRef} />
      </div>
    </div>
  )
}
