"use client"

import { useOthers } from "@liveblocks/react/suspense"
import { useReactFlow, useViewport } from "@xyflow/react"
import { Loader2 } from "lucide-react"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

export function PresenceCursors() {
  const others = useOthers()
  const { flowToScreenPosition } = useReactFlow<CanvasNode, CanvasEdge>()
  useViewport()

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {others.map((other) => {
        if (!other.presence.cursor) {
          return null
        }

        const screenPosition = flowToScreenPosition(other.presence.cursor)
        const color = other.info.color || "var(--accent-primary)"
        const name = other.info.name || "Collaborator"

        return (
          <div
            key={other.connectionId}
            className="absolute left-0 top-0 flex items-start"
            style={{
              color,
              transform: `translate(${screenPosition.x}px, ${screenPosition.y}px)`,
            }}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 18 24"
              className="h-6 w-5 drop-shadow-lg"
              fill="none"
            >
              <path
                d="M2 2L16 13L9.5 14.5L6 22L2 2Z"
                fill="currentColor"
                stroke="var(--bg-base)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="ml-1 mt-4 flex max-w-40 items-center gap-1.5 truncate rounded-xl px-2 py-1 text-xs font-medium shadow-lg"
              style={{
                backgroundColor: color,
                color: "var(--bg-base)",
              }}
            >
              {other.presence.thinking ? (
                <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
              ) : null}
              <span className="truncate">{name}</span>
            </span>
          </div>
        )
      })}
    </div>
  )
}
