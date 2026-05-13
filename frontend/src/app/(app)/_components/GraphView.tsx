'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { getGraphDataAction } from '../actions/note-actions'

// react-force-graph-2d는 canvas/DOM 기반 → SSR 불가 → dynamic import
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
      그래프 로딩 중...
    </div>
  ),
})

interface GraphNode {
  id: string
  title: string
}

interface GraphLink {
  source: string
  target: string
}

interface Props {
  onNodeClick: (id: string) => void
}

export function GraphView({ onNodeClick }: Props) {
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({
    nodes: [],
    links: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getGraphDataAction()
      .then(setGraphData)
      .catch(() => {}) // 그래프 로드 실패는 무시 (빈 상태 표시)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900 text-slate-500 text-sm">
        로딩 중...
      </div>
    )
  }

  if (!graphData.nodes.length) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900 text-slate-400 text-sm">
        노트를 작성하면 그래프가 표시됩니다
      </div>
    )
  }

  return (
    <div className="flex-1 bg-slate-900">
      <ForceGraph2D
        graphData={graphData}
        backgroundColor="#0f172a"
        linkColor={() => '#334155'}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const n = node as GraphNode & { x: number; y: number }
          // 노드 원
          ctx.beginPath()
          ctx.arc(n.x, n.y, 5, 0, 2 * Math.PI)
          ctx.fillStyle = '#3b82f6'
          ctx.fill()
          // 라벨
          const fontSize = Math.max(10 / globalScale, 2)
          ctx.font = `${fontSize}px Sans-Serif`
          ctx.fillStyle = '#94a3b8'
          ctx.textAlign = 'left'
          ctx.fillText(n.title, n.x + 7, n.y + 3)
        }}
        onNodeClick={(node) => {
          const n = node as GraphNode
          onNodeClick(n.id)
        }}
      />
    </div>
  )
}
