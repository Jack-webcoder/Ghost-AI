"use client"

import { useState, type DragEvent } from "react"
import {
  Circle,
  Database,
  Diamond,
  Hexagon,
  Pill,
  RectangleHorizontal,
  type LucideIcon,
} from "lucide-react"
import { NodeShapeSurface } from "@/components/editor/canvas/node-shape-surface"
import {
  DEFAULT_NODE_COLOR,
  NODE_SHAPES,
  SHAPE_DEFAULTS,
  type CanvasNodeShape,
} from "@/types/canvas"

export const SHAPE_DRAG_MIME_TYPE = "application/x-ghost-ai-shape"
const SHAPE_DRAG_FALLBACK_TYPE = "text/plain"

export interface ShapeDragPayload {
  shape: CanvasNodeShape
  width: number
  height: number
}

const SHAPE_ICONS: Record<CanvasNodeShape, LucideIcon> = {
  rectangle: RectangleHorizontal,
  diamond: Diamond,
  circle: Circle,
  pill: Pill,
  cylinder: Database,
  hexagon: Hexagon,
}

interface ShapeDragPreview extends ShapeDragPayload {
  clientX: number
  clientY: number
}

export function ShapePanel() {
  const [dragPreview, setDragPreview] = useState<ShapeDragPreview | null>(null)

  function handleDragStart(
    event: DragEvent<HTMLButtonElement>,
    shape: CanvasNodeShape
  ) {
    const payload: ShapeDragPayload = {
      shape,
      ...SHAPE_DEFAULTS[shape],
    }
    const hiddenDragImage = document.createElement("div")

    hiddenDragImage.style.position = "fixed"
    hiddenDragImage.style.left = "-1px"
    hiddenDragImage.style.top = "-1px"
    hiddenDragImage.style.width = "1px"
    hiddenDragImage.style.height = "1px"
    hiddenDragImage.style.opacity = "0"
    document.body.appendChild(hiddenDragImage)

    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData(
      SHAPE_DRAG_MIME_TYPE,
      JSON.stringify(payload)
    )
    event.dataTransfer.setData(
      SHAPE_DRAG_FALLBACK_TYPE,
      JSON.stringify(payload)
    )
    event.dataTransfer.setDragImage(hiddenDragImage, 0, 0)

    setDragPreview({
      ...payload,
      clientX: event.clientX,
      clientY: event.clientY,
    })

    requestAnimationFrame(() => hiddenDragImage.remove())
  }

  function handleDrag(event: DragEvent<HTMLButtonElement>) {
    if (event.clientX === 0 && event.clientY === 0) {
      return
    }

    setDragPreview((current) =>
      current
        ? {
            ...current,
            clientX: event.clientX,
            clientY: event.clientY,
          }
        : null
    )
  }

  return (
    <>
      <div className="nodrag nopan nowheel absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-surface-border bg-surface/95 p-1.5 shadow-lg backdrop-blur">
        {NODE_SHAPES.map((shape) => {
          const Icon = SHAPE_ICONS[shape]

          return (
            <button
              key={shape}
              type="button"
              draggable
              aria-label={`Drag ${shape} shape`}
              title={shape}
              className="nodrag nopan flex size-9 cursor-grab items-center justify-center rounded-full text-copy-secondary transition-colors hover:bg-subtle hover:text-copy-primary active:cursor-grabbing"
              onDragStart={(event) => handleDragStart(event, shape)}
              onDrag={handleDrag}
              onDragEnd={() => setDragPreview(null)}
            >
              <Icon className="size-4" aria-hidden="true" />
            </button>
          )
        })}
      </div>

      {dragPreview && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-50 opacity-60"
          style={{
            left: dragPreview.clientX,
            top: dragPreview.clientY,
            width: dragPreview.width,
            height: dragPreview.height,
            transform: "translate(-50%, -50%)",
          }}
        >
          <NodeShapeSurface
            color={DEFAULT_NODE_COLOR}
            shape={dragPreview.shape}
          />
        </div>
      )}
    </>
  )
}
