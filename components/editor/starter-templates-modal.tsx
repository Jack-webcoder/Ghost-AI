"use client"

import type { CSSProperties } from "react"
import { Import } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/starter-templates"
import type { CanvasNode, CanvasNodeShape } from "@/types/canvas"

interface StarterTemplatesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (template: CanvasTemplate) => void
}

interface PreviewBounds {
  minX: number
  minY: number
  width: number
  height: number
}

const PREVIEW_WIDTH = 360
const PREVIEW_HEIGHT = 220
const PREVIEW_PADDING = 22

function getNodeWidth(node: CanvasNode) {
  return node.width ?? node.measured?.width ?? 140
}

function getNodeHeight(node: CanvasNode) {
  return node.height ?? node.measured?.height ?? 80
}

function getNodeCenter(node: CanvasNode) {
  return {
    x: node.position.x + getNodeWidth(node) / 2,
    y: node.position.y + getNodeHeight(node) / 2,
  }
}

function getPreviewBounds(nodes: CanvasNode[]): PreviewBounds {
  const firstNode = nodes[0]

  if (!firstNode) {
    return { minX: 0, minY: 0, width: 1, height: 1 }
  }

  const initialBounds = {
    minX: firstNode.position.x,
    minY: firstNode.position.y,
    maxX: firstNode.position.x + getNodeWidth(firstNode),
    maxY: firstNode.position.y + getNodeHeight(firstNode),
  }

  const bounds = nodes.reduce((currentBounds, node) => {
    const nodeWidth = getNodeWidth(node)
    const nodeHeight = getNodeHeight(node)

    return {
      minX: Math.min(currentBounds.minX, node.position.x),
      minY: Math.min(currentBounds.minY, node.position.y),
      maxX: Math.max(currentBounds.maxX, node.position.x + nodeWidth),
      maxY: Math.max(currentBounds.maxY, node.position.y + nodeHeight),
    }
  }, initialBounds)

  return {
    minX: bounds.minX,
    minY: bounds.minY,
    width: Math.max(bounds.maxX - bounds.minX, 1),
    height: Math.max(bounds.maxY - bounds.minY, 1),
  }
}

function getPreviewTransform(bounds: PreviewBounds) {
  const scale = Math.min(
    (PREVIEW_WIDTH - PREVIEW_PADDING * 2) / bounds.width,
    (PREVIEW_HEIGHT - PREVIEW_PADDING * 2) / bounds.height
  )

  return {
    scale,
    offsetX:
      PREVIEW_PADDING +
      (PREVIEW_WIDTH - PREVIEW_PADDING * 2 - bounds.width * scale) / 2,
    offsetY:
      PREVIEW_PADDING +
      (PREVIEW_HEIGHT - PREVIEW_PADDING * 2 - bounds.height * scale) / 2,
  }
}

function projectPoint(
  point: { x: number; y: number },
  bounds: PreviewBounds,
  transform: ReturnType<typeof getPreviewTransform>
) {
  return {
    x: (point.x - bounds.minX) * transform.scale + transform.offsetX,
    y: (point.y - bounds.minY) * transform.scale + transform.offsetY,
  }
}

function getShapeStyle(shape: CanvasNodeShape): CSSProperties {
  if (shape === "circle" || shape === "pill") {
    return { borderRadius: "9999px" }
  }

  if (shape === "diamond") {
    return {
      clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
    }
  }

  if (shape === "hexagon") {
    return {
      clipPath:
        "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
    }
  }

  if (shape === "cylinder") {
    return {
      borderRadius: "50% / 16%",
    }
  }

  return { borderRadius: "0.375rem" }
}

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const bounds = getPreviewBounds(template.nodes)
  const transform = getPreviewTransform(bounds)
  const nodeById = new Map(template.nodes.map((node) => [node.id, node]))

  return (
    <div className="relative h-64 overflow-hidden border-b border-surface-border bg-base">
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}
      >
        {template.edges.map((edge) => {
          const source = nodeById.get(edge.source)
          const target = nodeById.get(edge.target)

          if (!source || !target) {
            return null
          }

          const sourcePoint = projectPoint(
            getNodeCenter(source),
            bounds,
            transform
          )
          const targetPoint = projectPoint(
            getNodeCenter(target),
            bounds,
            transform
          )

          return (
            <line
              key={edge.id}
              x1={sourcePoint.x}
              y1={sourcePoint.y}
              x2={targetPoint.x}
              y2={targetPoint.y}
              stroke="var(--text-secondary)"
              strokeLinecap="round"
              strokeOpacity="0.62"
              strokeWidth="1.5"
            />
          )
        })}
      </svg>

      {template.nodes.map((node) => {
        const projectedPosition = projectPoint(
          node.position,
          bounds,
          transform
        )
        const width = getNodeWidth(node) * transform.scale
        const height = getNodeHeight(node) * transform.scale

        return (
          <div
            key={node.id}
            className="absolute flex items-center justify-center border border-copy-primary/10 px-1 text-center text-[9px] font-medium leading-tight"
            style={{
              left: projectedPosition.x,
              top: projectedPosition.y,
              width,
              height,
              minWidth: 16,
              minHeight: 16,
              backgroundColor: node.data.color,
              color: node.data.textColor,
              ...getShapeStyle(node.data.shape),
            }}
            title={node.data.label}
          >
            <span className="line-clamp-2">{node.data.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  function handleImport(template: CanvasTemplate) {
    onImport(template)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] !max-w-[82rem] gap-8 overflow-hidden rounded-3xl border border-surface-border bg-surface p-8 text-copy-primary sm:p-10">
        <DialogHeader>
          <DialogTitle className="text-3xl font-semibold text-copy-primary">
            Import Template
          </DialogTitle>

          <DialogDescription className="text-base text-copy-muted">
            Choose a starter template to pre-populate your canvas. Any existing
            nodes will be replaced — use{" "}
            <kbd className="rounded-md border border-surface-border bg-elevated px-1.5 py-0.5 text-xs">
              ⌘Z
            </kbd>{" "}
            to undo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[560px] grid-cols-1 gap-6 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
          {CANVAS_TEMPLATES.map((template) => (
            <article
              key={template.id}
              className="flex min-h-[520px] min-w-0 flex-col overflow-hidden rounded-2xl border border-surface-border bg-elevated"
            >
              <TemplatePreview template={template} />

              <div className="flex flex-1 flex-col gap-4 p-6">
                <div>
                  <h3 className="text-lg font-semibold text-copy-primary">
                    {template.name}
                  </h3>

                  <p className="mt-2 text-base leading-7 text-copy-muted">
                    {template.description}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="mt-auto h-12 rounded-xl border-surface-border bg-transparent text-copy-primary hover:bg-surface"
                  onClick={() => handleImport(template)}
                >
                  <Import className="mr-2 h-4 w-4" />
                  Import
                </Button>
              </div>
            </article>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}