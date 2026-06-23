"use client"

import { useEffect, useRef, useState } from "react"
import { useMutation } from "@liveblocks/react/suspense"
import {
  Handle,
  NodeResizer,
  NodeToolbar,
  Position,
  type NodeProps,
} from "@xyflow/react"
import { NodeShapeSurface } from "@/components/editor/canvas/node-shape-surface"
import {
  DEFAULT_NODE_TEXT_COLOR,
  NODE_COLORS,
  type CanvasNode as CanvasNodeType,
} from "@/types/canvas"

const HANDLE_CLASS_NAME =
  "!z-20 !h-2 !w-2 !border-2 !border-base !bg-copy-primary !opacity-0 !transition-opacity group-hover/node:!opacity-100"

export function CanvasNode({
  id,
  data,
  selected,
}: NodeProps<CanvasNodeType>) {
  const [isEditing, setIsEditing] = useState(false)
  const [label, setLabel] = useState(data.label)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus()
      textareaRef.current?.select()
    }
  }, [isEditing])

  const updateLabel = useMutation(
    ({ storage }, nextLabel: string) => {
      const node = storage.get("flow").get("nodes").get(id)
      const nodeData = node?.get("data") as
        | {
            set: (key: "label", value: string) => void
          }
        | undefined

      nodeData?.set("label", nextLabel)
    },
    [id]
  )

  const updateNodeColor = useMutation(
    ({ storage }, color: string, textColor: string) => {
      const node = storage.get("flow").get("nodes").get(id)
      const nodeData = node?.get("data") as
        | {
            set: (
              key: "color" | "textColor",
              value: string
            ) => void
          }
        | undefined

      nodeData?.set("color", color)
      nodeData?.set("textColor", textColor)
    },
    [id]
  )

  function handleLabelChange(nextLabel: string) {
    setLabel(nextLabel)
    updateLabel(nextLabel)
  }

  function stopEditing() {
    setIsEditing(false)
  }

  const handleClassName = `${HANDLE_CLASS_NAME} ${
    selected ? "!opacity-100" : ""
  }`
  const textColor = data.textColor ?? DEFAULT_NODE_TEXT_COLOR

  return (
    <div className="group/node relative flex h-full w-full items-center justify-center">
      <NodeToolbar
        isVisible={selected}
        position={Position.Top}
        offset={12}
        className="nodrag nopan flex items-center gap-1.5 rounded-xl border border-surface-border bg-elevated/95 p-2 shadow-lg backdrop-blur-sm"
        onMouseDown={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {NODE_COLORS.map((colorPair, index) => {
          const isActive =
            data.color === colorPair.fill && textColor === colorPair.text

          return (
            <button
              key={colorPair.fill}
              type="button"
              aria-label={`Apply node color ${index + 1}`}
              aria-pressed={isActive}
              className="nodrag nopan h-5 w-5 rounded-full border-2 transition-[box-shadow,transform] hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copy-primary"
              style={{
                backgroundColor: colorPair.fill,
                borderColor: isActive ? colorPair.text : "transparent",
              }}
              onClick={() =>
                updateNodeColor(colorPair.fill, colorPair.text)
              }
              onMouseEnter={(event) => {
                event.currentTarget.style.boxShadow = `0 0 5px 2px ${colorPair.text}54`
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.boxShadow = "none"
              }}
              onMouseDown={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            />
          )
        })}
      </NodeToolbar>

      <NodeResizer
        isVisible={selected}
        minWidth={60}
        minHeight={40}
        handleStyle={{
          width: 8,
          height: 8,
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--text-secondary)",
          borderRadius: "9999px",
          zIndex: 30,
        }}
        lineStyle={{
          borderColor: "var(--border-subtle)",
          borderStyle: "dashed",
        }}
      />

      <NodeShapeSurface
        color={data.color}
        selected={selected}
        shape={data.shape}
      />

      <Handle
        type="source"
        id="top"
        position={Position.Top}
        isConnectableStart
        isConnectableEnd
        className={handleClassName}
      />
      <Handle
        type="source"
        id="right"
        position={Position.Right}
        isConnectableStart
        isConnectableEnd
        className={handleClassName}
      />
      <Handle
        type="source"
        id="bottom"
        position={Position.Bottom}
        isConnectableStart
        isConnectableEnd
        className={handleClassName}
      />
      <Handle
        type="source"
        id="left"
        position={Position.Left}
        isConnectableStart
        isConnectableEnd
        className={handleClassName}
      />

      <div
        className="relative z-10 flex h-full w-full items-center justify-center px-4 py-3 text-center text-sm"
        style={{ color: textColor }}
        onDoubleClick={(event) => {
          event.stopPropagation()
          setLabel(data.label)
          setIsEditing(true)
        }}
      >
        <span
          className={`pointer-events-none whitespace-pre-wrap ${
            isEditing ? "invisible" : data.label ? "" : "opacity-60"
          }`}
          aria-hidden={isEditing}
        >
          {data.label || "Double-click to label"}
        </span>

        {isEditing && (
          <textarea
            ref={textareaRef}
            value={label}
            aria-label="Node label"
            placeholder="Type a label"
            rows={1}
            className="nodrag nopan pointer-events-auto absolute left-4 right-4 top-1/2 h-10 -translate-y-1/2 resize-none overflow-hidden bg-transparent py-2.5 text-center text-sm text-current caret-brand outline-none placeholder:text-current placeholder:opacity-60"
            onChange={(event) => handleLabelChange(event.target.value)}
            onBlur={stopEditing}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault()
                stopEditing()
              }
            }}
            onMouseDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onDoubleClick={(event) => event.stopPropagation()}
          />
        )}
      </div>
    </div>
  )
}
