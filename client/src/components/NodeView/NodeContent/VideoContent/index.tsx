import { useRecoilState, useRecoilValue } from 'recoil'
import ReactPlayer from 'react-player/lazy'
import { endpoint } from '../../../../global'

import {
  currentNodeState,
  refreshAnchorState,
  refreshLinkListState,
  refreshState,
  selectedAnchorsState,
  selectedExtentState,
  startAnchorState,
} from '../../../../global/Atoms'

export default () => {
  const currentNode = useRecoilValue(currentNodeState)

  const { content } = currentNode
  return (
    <div>
      {/* @ts-ignore */}
      <ReactPlayer
        controls
        url={`${endpoint}node/video/proxy?location=${encodeURIComponent(content)}`}
      />
    </div>
  )
}
