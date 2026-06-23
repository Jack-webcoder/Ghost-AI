"use client"

import { LiveMap, LiveObject } from "@liveblocks/client"
import { ClientSideSuspense } from "@liveblocks/react"
import {
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense"
import { ReactFlowProvider } from "@xyflow/react"
import type {
  LiveblocksEdge,
  LiveblocksNode,
} from "@liveblocks/react-flow"
import { CanvasEditor } from "@/components/editor/canvas/canvas-editor"
import { CanvasErrorBoundary } from "@/components/editor/canvas/canvas-error-boundary"
import type { CanvasTemplate } from "@/components/editor/starter-templates"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

interface CanvasRoomProps {
  roomId: string
  pendingTemplate: CanvasTemplate | null
  onTemplateImported: () => void
}

export function CanvasRoom({
  roomId,
  pendingTemplate,
  onTemplateImported,
}: CanvasRoomProps) {
  return (
    <CanvasErrorBoundary>
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
        <RoomProvider
          id={roomId}
          initialPresence={{ cursor: null, thinking: false }}
          initialStorage={{
            flow: new LiveObject({
              nodes: new LiveMap<string, LiveblocksNode<CanvasNode>>(),
              edges: new LiveMap<string, LiveblocksEdge<CanvasEdge>>(),
            }),
          }}
        >
          <ClientSideSuspense
            fallback={
              <div className="flex h-full items-center justify-center bg-base text-sm text-copy-muted">
                Loading collaborative canvas...
              </div>
            }
          >
            <ReactFlowProvider>
              <CanvasEditor
                pendingTemplate={pendingTemplate}
                onTemplateImported={onTemplateImported}
              />
            </ReactFlowProvider>
          </ClientSideSuspense>
        </RoomProvider>
      </LiveblocksProvider>
    </CanvasErrorBoundary>
  )
}
