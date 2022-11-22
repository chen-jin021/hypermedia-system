import {
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Textarea,
} from '@chakra-ui/react'
import React, { useState } from 'react'
import { BiLinkAlt } from 'react-icons/bi'
import { FrontendAnchorGateway } from '../../../anchors'
import { generateObjectId } from '../../../global'
import { FrontendLinkGateway } from '../../../links'
import { ILink, NodeIdsToNodesMap } from '../../../types'
import { Button } from '../../Button'
import { useRecoilState, useSetRecoilState, useRecoilValue } from 'recoil'
import {
  isLinkingState,
  refreshState,
  startAnchorState,
  endAnchorState,
  selectedAnchorsState,
} from '../../../global/Atoms'
import './CompleteLinkModal.scss'

export interface ICompleteLinkModalProps {
  isOpen: boolean
  nodeIdsToNodes: NodeIdsToNodesMap
  onClose: () => void
}

const Range = (props: any) => {
  const { box } = props

  const [range, setRange] = useState({ start: 0, end: 0 })

  box.range = range

  const onChange = (type: 'start' | 'end') => (e: Record<any, any>) => {
    const value = e.target.value
    return setRange({ ...range, [type]: value })
    // if (type === 'start') {
    //   if (value > another) {
    //     return setRange({ start: value, end: value })
    //   }
    //   return setRange({ start: value, end: another })
    // }

    // if (value < another) {
    //   return setRange({ start: value, end: value })
    // }
    // return setRange({ end: value, start: another })
  }

  return (
    <div className="video-range">
      <input type="number" value={range.start} onChange={onChange('start')} />
      ~
      <input type="number" value={range.end} onChange={onChange('end')} /> s
    </div>
  )
}

/**
 * Modal for adding a new node; lets the user choose a title, type,
 * and parent node
 */
export const CompleteLinkModal = (props: ICompleteLinkModalProps) => {
  const { isOpen, onClose, nodeIdsToNodes } = props
  // State variables
  const [title, setTitle] = useState('')
  const [explainer, setExplainer] = useState('')
  const [error, setError] = useState<string>('')
  const setIsLinking = useSetRecoilState(isLinkingState)
  const [startAnchor, setStartAnchor] = useRecoilState(startAnchorState)
  const endAnchor = useRecoilValue(endAnchorState)
  const setSelectedAnchors = useSetRecoilState(selectedAnchorsState)
  const [refresh, setRefresh] = useRecoilState(refreshState)

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value)
  }

  const handleExplainerChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setExplainer(event.target.value)
  }

  // Called when the "Submit" button is clicked
  const handleSubmit = async () => {
    // create link from modal
    if (startAnchor && endAnchor) {
      let link: ILink | null = null

      let anchor1 = await FrontendAnchorGateway.getAnchor(startAnchor.anchorId)
      let anchor2 = await FrontendAnchorGateway.getAnchor(endAnchor.anchorId)
      if (!anchor1.success) {
        const payload = { ...startAnchor }

        if (startAnchor.nodeId.includes('video')) {
          payload.extent = {
            type: 'video',
            start: Number(box1.range.start),
            end: Number(box1.range.end),
          }
        }

        anchor1 = await FrontendAnchorGateway.createAnchor(payload)
      }
      if (!anchor2.success) {
        const payload = { ...endAnchor }
        if (endAnchor.nodeId.includes('video')) {
          payload.extent = {
            type: 'video',
            start: Number(box2.range.start),
            end: Number(box2.range.end),
          }
        }
        anchor2 = await FrontendAnchorGateway.createAnchor(payload)
      }

      if (anchor1.success && anchor2.success) {
        const anchor1Id = startAnchor.anchorId
        const anchor2Id = endAnchor.anchorId
        const anchor1NodeId = startAnchor.nodeId
        const anchor2NodeId = endAnchor.nodeId

        const linkId = generateObjectId('link')

        const newLink: ILink = {
          anchor1Id: anchor1Id,
          anchor2Id: anchor2Id,
          anchor1NodeId: anchor1NodeId,
          anchor2NodeId: anchor2NodeId,
          dateCreated: new Date(),
          explainer: explainer,
          linkId: linkId,
          title: title,
        }
        const linkResponse = await FrontendLinkGateway.createLink(newLink)
        if (!linkResponse.success) {
          setError('Error: Failed to create link')
          return
        }
        link = linkResponse.payload

        anchor2.payload && setSelectedAnchors([anchor2.payload])
      } else {
        setError('Error: Failed to create anchors')
        return
      }
      if (link !== null) {
        handleClose()
        setIsLinking(false)
        setStartAnchor(null)
        setRefresh(!refresh)
      } else {
        setError('Error: Failed to create link')
      }
    } else {
      setError('Error: Anchor 1 or 2 is missing')
    }
  }

  /** Reset all our state variables and close the modal */
  const handleClose = () => {
    onClose()
    setTitle('')
    setExplainer('')
    setError('')
  }

  const fromNodeId = startAnchor?.nodeId
  const toNodeId = endAnchor?.nodeId
  const nodeFromTitle = fromNodeId ? nodeIdsToNodes[fromNodeId].title : 'node'
  const nodeToTitle =
    toNodeId && nodeIdsToNodes[toNodeId] ? nodeIdsToNodes[toNodeId].title : 'node'

  console.log(startAnchor, endAnchor, 'mockkkk')

  const showFirstRange = startAnchor?.nodeId?.includes('video')
  const showSecondRange = endAnchor?.nodeId?.includes('video')

  const box1 = {} as Record<any, any>
  const box2 = {} as Record<any, any>

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="modal-font">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Complete link</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <div>
              Creating a bidirectional link from <b>{nodeFromTitle}</b> to
              <b> {nodeToTitle}</b>
            </div>
            <FormControl mt={4}>
              <FormLabel>Link Title</FormLabel>
              <Input value={title} onChange={handleTitleChange} placeholder="Title..." />
            </FormControl>

            {showFirstRange && (
              <FormControl mt={4}>
                <FormLabel>Range Of Video 1</FormLabel>
                <Range box={box1} />
              </FormControl>
            )}
            {showSecondRange && (
              <FormControl mt={4}>
                <FormLabel>Range Of Video 2</FormLabel>
                <Range box={box2} />
              </FormControl>
            )}

            <FormControl mt={4}>
              <FormLabel>Link Explainer</FormLabel>
              <Textarea
                value={explainer}
                onChange={handleExplainerChange}
                placeholder="Explainer..."
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            {error.length > 0 && <div className="modal-error">{error}</div>}
            <div className="modal-footer-buttons">
              <Button text="Create" icon={<BiLinkAlt />} onClick={handleSubmit} />
            </div>
          </ModalFooter>
        </ModalContent>
      </div>
    </Modal>
  )
}
