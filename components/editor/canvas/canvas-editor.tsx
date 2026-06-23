"use client"

import { useEffect, useRef, type DragEvent, type MouseEvent } from "react"
import { LiveObject, type JsonObject } from "@liveblocks/client"
import { useMutation, useUpdateMyPresence } from "@liveblocks/react/suspense"
import type { LiveblocksNode } from "@liveblocks/react-flow"
import {
  addEdge,
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ConnectionMode,
  MarkerType,
  ReactFlow,
  useReactFlow,
  type Connection,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import { CanvasEdge as CanvasEdgeRenderer } from "@/components/editor/canvas/canvas-edge"
import { CanvasControls } from "@/components/editor/canvas/canvas-controls"
import { CanvasNode as CanvasNodeRenderer } from "@/components/editor/canvas/canvas-node"
import { CollaboratorAvatars } from "@/components/editor/canvas/collaborator-avatars"
import { PresenceCursors } from "@/components/editor/canvas/presence-cursors"
import {
  SHAPE_DRAG_MIME_TYPE,
  ShapePanel,
  type ShapeDragPayload,
} from "@/components/editor/canvas/shape-panel"
import {
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_TEXT_COLOR,
  NODE_SHAPES,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas"
import type { CanvasTemplate } from "@/components/editor/starter-templates"
import "@xyflow/react/dist/style.css"

const SHAPE_DRAG_FALLBACK_TYPE = "text/plain"

const nodeTypes = {
  canvasNode: CanvasNodeRenderer,
} satisfies NodeTypes

const edgeTypes = {
  canvasEdge: CanvasEdgeRenderer,
} satisfies EdgeTypes

let nodeCounter = 0

interface CanvasEditorProps {
  pendingTemplate: CanvasTemplate | null
  onTemplateImported: () => void
}

function isShapeDragPayload(value: unknown): value is ShapeDragPayload {
  if (!value || typeof value !== "object") {
    return false
  }

  const payload = value as Record<string, unknown>

  return (
    typeof payload.shape === "string" &&
    NODE_SHAPES.includes(payload.shape as (typeof NODE_SHAPES)[number]) &&
    typeof payload.width === "number" &&
    Number.isFinite(payload.width) &&
    typeof payload.height === "number" &&
    Number.isFinite(payload.height)
  )
}

function cloneTemplateNode(node: CanvasNode): CanvasNode {
  return {
    ...node,
    position: { ...node.position },
    data: { ...node.data },
  }
}

function cloneTemplateEdge(edge: CanvasEdge): CanvasEdge {
  return {
    ...edge,
    data: edge.data ? { ...edge.data } : undefined,
    markerEnd:
      typeof edge.markerEnd === "object" && edge.markerEnd
        ? { ...edge.markerEnd }
        : edge.markerEnd,
    style: edge.style ? { ...edge.style } : undefined,
  }
}

export function CanvasEditor({
  pendingTemplate,
  onTemplateImported,
}: CanvasEditorProps) {
  const {
    fitView,
    screenToFlowPosition,
  } = useReactFlow<CanvasNode, CanvasEdge>()
  const updateMyPresence = useUpdateMyPresence()
  const importedTemplateIdRef = useRef<string | null>(null)
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onDelete,
  } = useLiveblocksFlow<CanvasNode, CanvasEdge>({
    suspense: true,
    nodes: {
      initial: [],
    },
    edges: {
      initial: [],
    },
  })

  useEffect(() => {
    if (!pendingTemplate) {
      importedTemplateIdRef.current = null
      return
    }

    if (importedTemplateIdRef.current === pendingTemplate.id) {
      return
    }

    importedTemplateIdRef.current = pendingTemplate.id

    if (edges.length > 0) {
      onEdgesChange(
        edges.map((edge) => ({
          id: edge.id,
          type: "remove",
        }))
      )
    }

    if (nodes.length > 0) {
      onNodesChange(
        nodes.map((node) => ({
          id: node.id,
          type: "remove",
        }))
      )
    }

    onNodesChange(
      pendingTemplate.nodes.map((node) => ({
        type: "add",
        item: cloneTemplateNode(node),
      }))
    )
    onEdgesChange(
      pendingTemplate.edges.map((edge) => ({
        type: "add",
        item: cloneTemplateEdge(edge),
      }))
    )

    window.requestAnimationFrame(() => {
      fitView({ padding: 0.2, duration: 300 })
      onTemplateImported()
    })
  }, [
    edges,
    fitView,
    nodes,
    onEdgesChange,
    onNodesChange,
    onTemplateImported,
    pendingTemplate,
  ])

  const addNode = useMutation(({ storage }, node: CanvasNode) => {
    storage
      .get("flow")
      .get("nodes")
      .set(
        node.id,
        LiveObject.from(node as unknown as JsonObject) as LiveblocksNode<CanvasNode>
      )
  }, [])

  function handleConnect(connection: Connection) {
    const nextEdges = addEdge<CanvasEdge>(connection, edges)

    if (nextEdges.length === edges.length) {
      return
    }

    const addedEdge = nextEdges[nextEdges.length - 1]

    onEdgesChange([
      {
        type: "add",
        item: {
          ...addedEdge,
          type: "canvasEdge",
          data: {
            label: "",
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "var(--text-primary)",
            width: 18,
            height: 18,
          },
          style: {
            strokeLinecap: "round",
            strokeLinejoin: "round",
          },
        },
      },
    ])
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()

    const serializedPayload =
      event.dataTransfer.getData(SHAPE_DRAG_MIME_TYPE) ||
      event.dataTransfer.getData(SHAPE_DRAG_FALLBACK_TYPE)

    if (!serializedPayload) {
      return
    }

    let payload: unknown

    try {
      payload = JSON.parse(serializedPayload)
    } catch {
      return
    }

    if (!isShapeDragPayload(payload)) {
      return
    }

    nodeCounter += 1
    const dropPosition = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    })

    addNode({
      id: `${payload.shape}-${Date.now()}-${nodeCounter}`,
      type: "canvasNode",
      position: {
        x: dropPosition.x - payload.width / 2,
        y: dropPosition.y - payload.height / 2,
      },
      width: payload.width,
      height: payload.height,
      data: {
        label: "",
        color: DEFAULT_NODE_COLOR,
        textColor: DEFAULT_NODE_TEXT_COLOR,
        shape: payload.shape,
      },
    })
  }

  function handlePointerMove(event: MouseEvent) {
    updateMyPresence({
      cursor: screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      }),
    })
  }

  function handlePointerLeave() {
    updateMyPresence({ cursor: null })
  }

  return (
    <div className="relative h-full w-full bg-base">
      <ReactFlow
        className="bg-base"
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onDelete={onDelete}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
        connectionMode={ConnectionMode.Loose}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{
          stroke: "var(--text-secondary)",
          strokeLinecap: "round",
          strokeWidth: 1.5,
        }}
        connectOnClick
        connectionRadius={24}
        fitView
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="var(--border-default)"
          gap={24}
          size={1.5}
        />
        <CanvasControls />
        <ShapePanel />
        <PresenceCursors />
        <CollaboratorAvatars />
      </ReactFlow>
    </div>
  )
}
