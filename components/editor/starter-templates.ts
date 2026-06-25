import { MarkerType } from "@xyflow/react"
import {
  NODE_COLORS,
  SHAPE_DEFAULTS,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeShape,
} from "@/types/canvas"

export interface CanvasTemplate {
  id: string
  name: string
  description: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

interface TemplateNodeInput {
  id: string
  label: string
  shape: CanvasNodeShape
  x: number
  y: number
  colorIndex: number
  width?: number
  height?: number
}

interface TemplateEdgeInput {
  id: string
  source: string
  target: string
  label?: string
}

function templateNode({
  id,
  label,
  shape,
  x,
  y,
  colorIndex,
  width = SHAPE_DEFAULTS[shape].width,
  height = SHAPE_DEFAULTS[shape].height,
}: TemplateNodeInput): CanvasNode {
  const colorPair = NODE_COLORS[colorIndex % NODE_COLORS.length]

  return {
    id,
    type: "canvasNode",
    position: { x, y },
    width,
    height,
    data: {
      label,
      color: colorPair.fill,
      textColor: colorPair.text,
      shape,
    },
  }
}

function templateEdge({
  id,
  source,
  target,
  label = "",
}: TemplateEdgeInput): CanvasEdge {
  return {
    id,
    source,
    target,
    type: "canvasEdge",
    data: { label },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "var(--text-primary)",
      width: 18,
      height: 18,
    },
    style: {
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
  }
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices-architecture",
    name: "Microservices Architecture",
    description:
      "API gateway, independent services, service-owned databases, cache, and an event bus for async coordination.",
    nodes: [
      templateNode({
        id: "micro-client",
        label: "Web / Mobile Clients",
        shape: "rectangle",
        x: -420,
        y: -40,
        colorIndex: 1,
      }),
      templateNode({
        id: "micro-gateway",
        label: "API Gateway",
        shape: "hexagon",
        x: -170,
        y: -40,
        colorIndex: 7,
      }),
      templateNode({
        id: "micro-auth",
        label: "Auth Service",
        shape: "pill",
        x: 80,
        y: -170,
        colorIndex: 2,
      }),
      templateNode({
        id: "micro-orders",
        label: "Orders Service",
        shape: "pill",
        x: 80,
        y: -40,
        colorIndex: 4,
      }),
      templateNode({
        id: "micro-payments",
        label: "Payments Service",
        shape: "pill",
        x: 80,
        y: 90,
        colorIndex: 5,
      }),
      templateNode({
        id: "micro-cache",
        label: "Shared Cache",
        shape: "cylinder",
        x: 330,
        y: -165,
        colorIndex: 6,
      }),
      templateNode({
        id: "micro-db",
        label: "Service Databases",
        shape: "cylinder",
        x: 330,
        y: -30,
        colorIndex: 3,
      }),
      templateNode({
        id: "micro-events",
        label: "Event Bus",
        shape: "rectangle",
        x: 330,
        y: 120,
        colorIndex: 7,
      }),
    ],
    edges: [
      templateEdge({
        id: "micro-client-gateway",
        source: "micro-client",
        target: "micro-gateway",
      }),
      templateEdge({
        id: "micro-gateway-auth",
        source: "micro-gateway",
        target: "micro-auth",
      }),
      templateEdge({
        id: "micro-gateway-orders",
        source: "micro-gateway",
        target: "micro-orders",
      }),
      templateEdge({
        id: "micro-gateway-payments",
        source: "micro-gateway",
        target: "micro-payments",
      }),
      templateEdge({
        id: "micro-auth-cache",
        source: "micro-auth",
        target: "micro-cache",
      }),
      templateEdge({
        id: "micro-orders-db",
        source: "micro-orders",
        target: "micro-db",
      }),
      templateEdge({
        id: "micro-payments-db",
        source: "micro-payments",
        target: "micro-db",
      }),
      templateEdge({
        id: "micro-orders-events",
        source: "micro-orders",
        target: "micro-events",
      }),
      templateEdge({
        id: "micro-payments-events",
        source: "micro-payments",
        target: "micro-events",
      }),
    ],
  },
  {
    id: "ci-cd-pipeline",
    name: "CI/CD Pipeline",
    description:
      "A delivery flow from source control through build, tests, artifacts, deployment, and production monitoring.",
    nodes: [
      templateNode({
        id: "cicd-repo",
        label: "Git Repository",
        shape: "rectangle",
        x: -520,
        y: -20,
        colorIndex: 1,
      }),
      templateNode({
        id: "cicd-ci",
        label: "CI Runner",
        shape: "pill",
        x: -280,
        y: -20,
        colorIndex: 7,
      }),
      templateNode({
        id: "cicd-tests",
        label: "Test Suite",
        shape: "diamond",
        x: -40,
        y: -45,
        colorIndex: 3,
      }),
      templateNode({
        id: "cicd-artifact",
        label: "Artifact Registry",
        shape: "cylinder",
        x: 220,
        y: -20,
        colorIndex: 2,
      }),
      templateNode({
        id: "cicd-staging",
        label: "Staging",
        shape: "hexagon",
        x: 470,
        y: -130,
        colorIndex: 5,
      }),
      templateNode({
        id: "cicd-prod",
        label: "Production",
        shape: "hexagon",
        x: 470,
        y: 100,
        colorIndex: 6,
      }),
      templateNode({
        id: "cicd-observe",
        label: "Monitoring",
        shape: "circle",
        x: 720,
        y: -20,
        colorIndex: 4,
      }),
    ],
    edges: [
      templateEdge({
        id: "cicd-repo-ci",
        source: "cicd-repo",
        target: "cicd-ci",
        label: "push",
      }),
      templateEdge({
        id: "cicd-ci-tests",
        source: "cicd-ci",
        target: "cicd-tests",
      }),
      templateEdge({
        id: "cicd-tests-artifact",
        source: "cicd-tests",
        target: "cicd-artifact",
        label: "pass",
      }),
      templateEdge({
        id: "cicd-artifact-staging",
        source: "cicd-artifact",
        target: "cicd-staging",
      }),
      templateEdge({
        id: "cicd-staging-prod",
        source: "cicd-staging",
        target: "cicd-prod",
        label: "promote",
      }),
      templateEdge({
        id: "cicd-prod-observe",
        source: "cicd-prod",
        target: "cicd-observe",
      }),
      templateEdge({
        id: "cicd-observe-ci",
        source: "cicd-observe",
        target: "cicd-ci",
        label: "alerts",
      }),
    ],
  },
  {
    id: "event-driven-system",
    name: "Event-Driven System",
    description:
      "Producers publish domain events to a broker that fans out to consumers, projections, and analytics.",
    nodes: [
      templateNode({
        id: "event-api",
        label: "Public API",
        shape: "hexagon",
        x: -420,
        y: -40,
        colorIndex: 1,
      }),
      templateNode({
        id: "event-producer",
        label: "Order Producer",
        shape: "pill",
        x: -170,
        y: -40,
        colorIndex: 7,
      }),
      templateNode({
        id: "event-broker",
        label: "Event Broker",
        shape: "rectangle",
        x: 80,
        y: -40,
        colorIndex: 3,
      }),
      templateNode({
        id: "event-payment",
        label: "Payment Consumer",
        shape: "pill",
        x: 330,
        y: -180,
        colorIndex: 4,
      }),
      templateNode({
        id: "event-inventory",
        label: "Inventory Consumer",
        shape: "pill",
        x: 330,
        y: -40,
        colorIndex: 6,
      }),
      templateNode({
        id: "event-read-model",
        label: "Read Model",
        shape: "cylinder",
        x: 330,
        y: 100,
        colorIndex: 2,
      }),
      templateNode({
        id: "event-analytics",
        label: "Analytics Sink",
        shape: "cylinder",
        x: 580,
        y: -40,
        colorIndex: 5,
      }),
    ],
    edges: [
      templateEdge({
        id: "event-api-producer",
        source: "event-api",
        target: "event-producer",
      }),
      templateEdge({
        id: "event-producer-broker",
        source: "event-producer",
        target: "event-broker",
        label: "publish",
      }),
      templateEdge({
        id: "event-broker-payment",
        source: "event-broker",
        target: "event-payment",
      }),
      templateEdge({
        id: "event-broker-inventory",
        source: "event-broker",
        target: "event-inventory",
      }),
      templateEdge({
        id: "event-broker-read-model",
        source: "event-broker",
        target: "event-read-model",
      }),
      templateEdge({
        id: "event-read-model-analytics",
        source: "event-read-model",
        target: "event-analytics",
      }),
      templateEdge({
        id: "event-payment-analytics",
        source: "event-payment",
        target: "event-analytics",
      }),
    ],
  },
]
