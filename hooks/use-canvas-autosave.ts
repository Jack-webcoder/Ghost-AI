"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { CanvasEdge, CanvasNode, CanvasSnapshot } from "@/types/canvas"

const AUTOSAVE_DELAY_MS = 2000
const TRANSIENT_STATUS_MS = 1400

export type CanvasSaveStatus = "idle" | "saving" | "saved" | "error"

interface UseCanvasAutosaveOptions {
  projectId: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
}: UseCanvasAutosaveOptions) {
  const [status, setStatus] = useState<CanvasSaveStatus>("idle")
  const isFirstRender = useRef(true)
  const resetTimeoutRef = useRef<number | null>(null)
  const snapshot = useMemo<CanvasSnapshot>(
    () => ({ nodes, edges }),
    [edges, nodes]
  )

  const scheduleStatusReset = useCallback(() => {
    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current)
    }

    resetTimeoutRef.current = window.setTimeout(() => {
      setStatus("idle")
      resetTimeoutRef.current = null
    }, TRANSIENT_STATUS_MS)
  }, [])

  const saveNow = useCallback(
    async (signal?: AbortSignal) => {
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current)
        resetTimeoutRef.current = null
      }

      setStatus("saving")

      try {
        const response = await fetch(`/api/projects/${projectId}/canvas`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(snapshot),
          signal,
        })

        if (!response.ok) {
          throw new Error("Canvas save failed")
        }

        setStatus("saved")
        scheduleStatusReset()
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }

        setStatus("error")
        scheduleStatusReset()
      }
    },
    [projectId, scheduleStatusReset, snapshot]
  )

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => {
      void saveNow(controller.signal)
    }, AUTOSAVE_DELAY_MS)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [saveNow])

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current)
      }
    }
  }, [])

  return { saveNow, status }
}
