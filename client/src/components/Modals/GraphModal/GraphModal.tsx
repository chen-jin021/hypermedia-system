import {
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Textarea,
} from '@chakra-ui/react'
import React, { useCallback, useEffect, useState } from 'react'
import { useRecoilValue } from 'recoil'
import {
  currentNodeState,
  refreshLinkListState,
  selectedAnchorsState,
} from '../../../global/Atoms'
import {
  INode,
  NodeIdsToNodesMap,
  NodeType,
  nodeTypes,
  IAnchor,
  ILink,
  RecursiveNodeTree,
} from '../../../types'
import { AnchorItem, LinkItem } from '../../NodeView/NodeLinkMenu/AnchorItem'
import {
  includesAnchorId,
  loadAnchorToLinksMap,
} from '../../NodeView/NodeLinkMenu/nodeLinkMenuUtils'

import { Button } from '../../Button'
import { TreeView } from '../../TreeView'
import './GraphModal.scss'
import { useSetRecoilState } from 'recoil'
import { selectedNodeState } from '../../../global/Atoms'
import { NodeLinkMenu } from '../../NodeView/NodeLinkMenu'

import ReactFlow, { MiniMap, Controls } from 'react-flow-renderer'
import { FrontendAnchorGateway } from '../../../anchors'
import { FrontendNodeGateway } from '../../../nodes'
import { FrontendLinkGateway } from '../../../links'
import { setNode } from '@tiptap/core/dist/packages/core/src/commands'

export interface IGraphModalProps {
  isOpen: boolean
  nodeIdsToNodesMap: NodeIdsToNodesMap
  onClose: () => void
  onSubmit: () => unknown
  roots: RecursiveNodeTree[]
}

class Increase {
  static num = 0

  static get increase() {
    Increase.num = Increase.num + 1

    return Increase.num
  }
}

/**
 * Modal for showing the grphical relationship between nodes
 */

export const GraphModal = (props: IGraphModalProps) => {
  // deconstruct props variables
  const { isOpen, onClose, roots, nodeIdsToNodesMap, onSubmit } = props
  const linkMenuRefresh = useRecoilValue(refreshLinkListState)
  const selectedAnchors = useRecoilValue(selectedAnchorsState)
  const currentNode = useRecoilValue(currentNodeState)
  const [anchorsMap, setAnchorsMap] = useState<{
    [anchorId: string]: {
      anchor: IAnchor
      links: { link: ILink; oppNode: INode; oppAnchor: IAnchor }[]
    }
  }>({})
  const setSelectedNode = useSetRecoilState(selectedNodeState)
  const [selectedParentNode, setSelectedParentNode] = useState<INode | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedType, setSelectedType] = useState<NodeType>('' as NodeType)
  const [error, setError] = useState<string>('')

  /** Reset all our state variables and close the modal */
  const handleClose = () => {
    onClose()
    setTitle('')
    setSelectedParentNode(null)
    setSelectedType('' as NodeType)
    setContent('')
    setError('')
  }

  // getAnchorsByNodeId -> anchor objects IAnchor[]  ->  IServiceResponse<ILink[]> (edges)
  const [nodes, setNodes] = useState<
    {
      id: string
      data: { label: string }
      position: { x: number; y: number }
    }[]
  >([])

  const [edges, setEdges] = useState<
    {
      id: string
      source: string
      target: string
    }[]
  >([])

  useEffect(() => {
    // to get all the corresponding nodes using FrontendNodeGateway (currentNode)
    const loadFlowNodes = async () => {
      const anchorsFromNode = await FrontendAnchorGateway.getAnchorsByNodeId(
        currentNode.nodeId
      )
      let anchors: IAnchor[] = []
      if (anchorsFromNode.success && anchorsFromNode.payload) {
        anchors = anchorsFromNode.payload
      }

      const flowEdges: {
        id: string
        source: string
        target: string
      }[] = []

      const flowNodes: {
        id: string
        data: { label: string }
        position: { x: number; y: number }
      }[] = []

      // add the curNode
      flowNodes.push({
        id: currentNode.nodeId,
        data: { label: currentNode.title },
        position: { x: 100, y: 300 },
      })

      // nodes use anchorid as id
      for (let j = 0; j < anchors.length; j++) {
        const getLinkResp = await FrontendLinkGateway.getLinksByAnchorId(
          anchors[j].anchorId
        )

        if (getLinkResp.success && getLinkResp.payload) {
          // we have anchor 1 and anchor 2 get their node and connect them
          const links = getLinkResp.payload
          for (let i = 0; i < links.length; i++) {
            const link = links[i]
            // two anchors
            const anchor1NodeId = link.anchor1NodeId
            const anchor2NodeId = link.anchor2NodeId

            const requestId =
              currentNode.nodeId === anchor1NodeId ? anchor2NodeId : anchor1NodeId

            // get node/title by nodeid
            const nodeResp = await FrontendNodeGateway.getNode(requestId)
            if (nodeResp.success && nodeResp.payload) {
              const node1 = nodeResp.payload

              const id = node1.nodeId // String(Increase.increase)

              // check if already in array
              if (!flowNodes.some((e) => e.id === node1.nodeId)) {
                flowNodes.push({
                  id,
                  data: { label: node1.title },
                  position: { x: 40 * j + 40, y: 40 * j },
                })
              }

              // add edge as well
              flowEdges.push({
                id: String(Increase.increase),
                source: id,
                target: currentNode.nodeId,
              })
            }
          }
        }
      }

      debugger
      setNodes(flowNodes)
      setEdges(flowEdges)
    }
    loadFlowNodes()
  }, [currentNode, linkMenuRefresh, selectedAnchors])

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="modal-font">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Visualizing Node Collection</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <div style={{ width: '100%', height: '100vh' }}>
              <ReactFlow nodes={nodes} edges={edges} fitView />
            </div>
          </ModalBody>
          <ModalFooter>
            {error.length > 0 && <div className="modal-error">{error}</div>}
          </ModalFooter>
        </ModalContent>
      </div>
    </Modal>
  )
}
