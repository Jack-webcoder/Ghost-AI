"use client"

import { ClientSideSuspense } from "@liveblocks/react"
import { ReactFlowProvider } from "@xyflow/react"
import { CanvasEditor } from "@/components/editor/canvas/canvas-editor"
import type { CanvasSaveControls } from "@/components/editor/canvas/canvas-editor"
import { CanvasErrorBoundary } from "@/components/editor/canvas/canvas-error-boundary"
import type { CanvasTemplate } from "@/components/editor/starter-templates"

interface CanvasRoomProps {
  projectId: string
  pendingTemplate: CanvasTemplate | null
  onTemplateImported: () => void
  onSaveControlsChange: (controls: CanvasSaveControls) => void
  onAiStatus: (status: Liveblocks["RoomEvent"]) => void
}

export function CanvasRoom({
  projectId,
  pendingTemplate,
  onTemplateImported,
  onSaveControlsChange,
  onAiStatus,
}: CanvasRoomProps) {
  return (
    <CanvasErrorBoundary>
      <ClientSideSuspense
        fallback={
          <div className="flex h-full items-center justify-center bg-base text-sm text-copy-muted">
            Loading collaborative canvas...
          </div>
        }
      >
        <ReactFlowProvider>
          <CanvasEditor
            projectId={projectId}
            pendingTemplate={pendingTemplate}
            onTemplateImported={onTemplateImported}
            onSaveControlsChange={onSaveControlsChange}
            onAiStatus={onAiStatus}
          />
        </ReactFlowProvider>
      </ClientSideSuspense>
    </CanvasErrorBoundary>
  )
}
