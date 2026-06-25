"use client"

import { useEffect, useRef, useState } from "react"
import { LiveObject } from "@liveblocks/client"
import { useMutation } from "@liveblocks/react/suspense"
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react"
import type { CanvasEdge as CanvasEdgeType } from "@/types/canvas"

const EDGE_INTERACTION_WIDTH = 20

export function CanvasEdge({
  id,
  data,
  markerEnd,
  selected,
  sourcePosition,
  sourceX,
  sourceY,
  targetPosition,
  targetX,
  targetY,
}: EdgeProps<CanvasEdgeType>) {
  const savedLabel = data?.label ?? ""
  const [draftLabel, setDraftLabel] = useState(savedLabel)
  const [isEditing, setIsEditing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  })

  const updateLabel = useMutation(
    ({ storage }, nextLabel: string) => {
      const edge = storage.get("flow").get("edges").get(id)
      const edgeData = edge?.get("data") as
        | {
            set: (key: "label", value: string) => void
          }
        | undefined

      if (edgeData) {
        edgeData.set("label", nextLabel)
      } else {
        edge?.set("data", new LiveObject({ label: nextLabel }))
      }
    },
    [id]
  )

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  function startEditing() {
    setDraftLabel(savedLabel)
    setIsEditing(true)
  }

  function saveLabel() {
    updateLabel(draftLabel)
    setIsEditing(false)
  }

  const isActive = selected || isHovered
  const shouldShowLabel = isEditing || Boolean(savedLabel) || selected

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={0}
        className="transition-[stroke,opacity] duration-150"
        style={{
          stroke: isActive
            ? "var(--text-primary)"
            : "var(--text-secondary)",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: 1.5,
          opacity: isActive ? 1 : 0.58,
        }}
      />

      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={EDGE_INTERACTION_WIDTH}
        className="cursor-pointer"
        style={{ pointerEvents: "stroke" }}
        onDoubleClick={(event) => {
          event.stopPropagation()
          startEditing()
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {shouldShowLabel && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-auto absolute"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onDoubleClick={(event) => {
              event.stopPropagation()
              startEditing()
            }}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                value={draftLabel}
                aria-label="Edge label"
                placeholder="Edge label"
                size={Math.max(draftLabel.length, 1)}
                className="nodrag nopan min-w-20 rounded-xl border border-surface-border bg-elevated px-2.5 py-1 text-center text-xs text-copy-primary caret-brand outline-none placeholder:text-copy-faint focus:border-brand"
                onChange={(event) => setDraftLabel(event.target.value)}
                onBlur={saveLabel}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === "Escape") {
                    event.preventDefault()
                    saveLabel()
                  }
                }}
                onMouseDown={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
                onDoubleClick={(event) => event.stopPropagation()}
              />
            ) : (
              <span
                className={`block cursor-text rounded-xl border px-2.5 py-1 text-xs backdrop-blur-sm ${
                  savedLabel
                    ? "border-surface-border bg-elevated/95 text-copy-primary"
                    : "border-transparent bg-elevated/70 text-copy-faint"
                }`}
              >
                {savedLabel || "Double-click to label"}
              </span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
