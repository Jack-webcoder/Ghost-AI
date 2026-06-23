"use client"

import { useEffect } from "react"
import type { ReactFlowInstance } from "@xyflow/react"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

const VIEWPORT_ANIMATION_DURATION = 200

interface UseKeyboardShortcutsOptions {
  reactFlow: ReactFlowInstance<CanvasNode, CanvasEdge>
  undo: () => void
  redo: () => void
}

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    target.closest("input, textarea, [contenteditable='true'], [contenteditable='']")
  )
}

export function useKeyboardShortcuts({
  reactFlow,
  undo,
  redo,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return
      }

      const modifierPressed = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()

      if (modifierPressed && key === "z") {
        event.preventDefault()

        if (event.shiftKey) {
          redo()
        } else {
          undo()
        }

        return
      }

      if (modifierPressed && key === "y") {
        event.preventDefault()
        redo()
        return
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault()
        void reactFlow.zoomIn({ duration: VIEWPORT_ANIMATION_DURATION })
        return
      }

      if (event.key === "-") {
        event.preventDefault()
        void reactFlow.zoomOut({ duration: VIEWPORT_ANIMATION_DURATION })
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [reactFlow, redo, undo])
}
