"use client"

import {
  useCanRedo,
  useCanUndo,
  useRedo,
  useUndo,
} from "@liveblocks/react/suspense"
import { useReactFlow } from "@xyflow/react"
import { Maximize, Redo2, Undo2, ZoomIn, ZoomOut } from "lucide-react"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

const VIEWPORT_ANIMATION_DURATION = 200

interface ControlButtonProps {
  label: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}

function ControlButton({
  label,
  disabled = false,
  onClick,
  children,
}: ControlButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      className="nodrag nopan flex size-9 items-center justify-center rounded-full text-copy-secondary transition-colors hover:bg-subtle hover:text-copy-primary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-copy-secondary"
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function CanvasControls() {
  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>()
  const undo = useUndo()
  const redo = useRedo()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()

  useKeyboardShortcuts({ reactFlow, undo, redo })

  return (
    <div className="nodrag nopan nowheel absolute bottom-4 left-4 z-20 flex items-center rounded-full border border-surface-border bg-surface/95 p-1.5 shadow-lg backdrop-blur">
      <div className="flex items-center">
        <ControlButton
          label="Zoom out"
          onClick={() => {
            void reactFlow.zoomOut({
              duration: VIEWPORT_ANIMATION_DURATION,
            })
          }}
        >
          <ZoomOut className="size-4" aria-hidden="true" />
        </ControlButton>
        <ControlButton
          label="Fit view"
          onClick={() => {
            void reactFlow.fitView({
              duration: VIEWPORT_ANIMATION_DURATION,
            })
          }}
        >
          <Maximize className="size-4" aria-hidden="true" />
        </ControlButton>
        <ControlButton
          label="Zoom in"
          onClick={() => {
            void reactFlow.zoomIn({
              duration: VIEWPORT_ANIMATION_DURATION,
            })
          }}
        >
          <ZoomIn className="size-4" aria-hidden="true" />
        </ControlButton>
      </div>

      <div
        className="mx-1 h-5 w-px bg-surface-border"
        aria-hidden="true"
      />

      <div className="flex items-center">
        <ControlButton label="Undo" disabled={!canUndo} onClick={undo}>
          <Undo2 className="size-4" aria-hidden="true" />
        </ControlButton>
        <ControlButton label="Redo" disabled={!canRedo} onClick={redo}>
          <Redo2 className="size-4" aria-hidden="true" />
        </ControlButton>
      </div>
    </div>
  )
}
