import type { JsonObject } from "@liveblocks/client"
import type { Edge, Node } from "@xyflow/react"

export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const

export type CanvasNodeShape = (typeof NODE_SHAPES)[number]

export const NODE_COLORS = [
  { fill: "#1F1F1F", text: "#EDEDED" },
  { fill: "#10233D", text: "#52A8FF" },
  { fill: "#2E1938", text: "#BF7AF0" },
  { fill: "#331B00", text: "#FF990A" },
  { fill: "#3C1618", text: "#FF6166" },
  { fill: "#3A1726", text: "#F75F8F" },
  { fill: "#0F2E18", text: "#62C073" },
  { fill: "#062822", text: "#0AC7B4" },
] as const

export const DEFAULT_NODE_COLOR = NODE_COLORS[0].fill
export const DEFAULT_NODE_TEXT_COLOR = NODE_COLORS[0].text

export const SHAPE_DEFAULTS: Record<
  CanvasNodeShape,
  { width: number; height: number }
> = {
  rectangle: { width: 160, height: 96 },
  diamond: { width: 144, height: 144 },
  circle: { width: 112, height: 112 },
  pill: { width: 160, height: 72 },
  cylinder: { width: 144, height: 104 },
  hexagon: { width: 152, height: 96 },
}

export interface CanvasNodeData extends JsonObject {
  label: string
  color: string
  textColor?: string
  shape: CanvasNodeShape
}

export interface CanvasEdgeData extends JsonObject {
  label?: string
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">
export type CanvasEdge = Edge<CanvasEdgeData, "canvasEdge">
