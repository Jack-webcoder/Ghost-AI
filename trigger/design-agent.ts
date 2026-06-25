import { LiveMap, LiveObject, type JsonObject } from "@liveblocks/client";
import type {
  LiveblocksEdge,
  LiveblocksNode,
} from "@liveblocks/react-flow";
import { AbortTaskRunError, schemaTask } from "@trigger.dev/sdk";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, Output, jsonSchema } from "ai";

import { getLiveblocks } from "@/lib/liveblocks";
import {
  NODE_COLORS,
  NODE_SHAPES,
  SHAPE_DEFAULTS,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeShape,
} from "@/types/canvas";

interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

type DesignActionType =
  | "add_node"
  | "move_node"
  | "resize_node"
  | "update_node_data"
  | "delete_node"
  | "add_edge"
  | "delete_edge";

interface DesignAction {
  type: DesignActionType;
  id?: string;
  label?: string;
  shape?: CanvasNodeShape;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  colorIndex?: number;
  source?: string;
  target?: string;
}

interface DesignPlan {
  summary: string;
  actions: DesignAction[];
}

interface MutableCanvasNodeData {
  get(key: "shape"): CanvasNodeShape;
  set(key: "label", value: string): void;
  set(key: "shape", value: CanvasNodeShape): void;
  set(key: "color", value: string): void;
  set(key: "textColor", value: string): void;
}

interface MutableStorageRoot {
  get(key: "flow"): LiveObject<{
    nodes: LiveMap<string, LiveblocksNode<CanvasNode>>;
    edges: LiveMap<string, LiveblocksEdge<CanvasEdge>>;
  }> | undefined;
  set(
    key: "flow",
    value: LiveObject<{
      nodes: LiveMap<string, LiveblocksNode<CanvasNode>>;
      edges: LiveMap<string, LiveblocksEdge<CanvasEdge>>;
    }>
  ): void;
}

const AI_USER_ID = "ghost-ai-design-agent";
const AI_STATUS_FEED_ID = "ai-status-feed";
const NODE_SPACING = 220;
const GRID_SIZE = 20;
const MAX_ACTIONS = 40;
const MIN_NODE_WIDTH = 60;
const MIN_NODE_HEIGHT = 40;

const designPlanSchema = jsonSchema<DesignPlan>({
  type: "object",
  additionalProperties: false,
  required: ["summary", "actions"],
  properties: {
    summary: {
      type: "string",
      maxLength: 240,
    },
    actions: {
      type: "array",
      maxItems: MAX_ACTIONS,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type"],
        properties: {
          type: {
            type: "string",
            enum: [
              "add_node",
              "move_node",
              "resize_node",
              "update_node_data",
              "delete_node",
              "add_edge",
              "delete_edge",
            ],
          },
          id: { type: "string", minLength: 1, maxLength: 80 },
          label: { type: "string", maxLength: 80 },
          shape: {
            type: "string",
            enum: [...NODE_SHAPES],
          },
          x: { type: "number" },
          y: { type: "number" },
          width: { type: "number" },
          height: { type: "number" },
          colorIndex: {
            type: "integer",
            minimum: 0,
            maximum: NODE_COLORS.length - 1,
          },
          source: { type: "string", minLength: 1, maxLength: 80 },
          target: { type: "string", minLength: 1, maxLength: 80 },
        },
      },
    },
  },
});

function parseDesignAgentPayload(value: unknown): DesignAgentPayload {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new AbortTaskRunError(
      "Design agent payload must be an object with non-empty prompt and roomId strings."
    );
  }

  const payload = value as Partial<Record<keyof DesignAgentPayload, unknown>>;

  if (
    typeof payload.prompt !== "string" ||
    payload.prompt.trim().length === 0 ||
    typeof payload.roomId !== "string" ||
    payload.roomId.trim().length === 0
  ) {
    throw new AbortTaskRunError(
      "Design agent payload must include non-empty string fields: prompt and roomId."
    );
  }

  return {
    prompt: payload.prompt.trim(),
    roomId: payload.roomId.trim(),
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function roundToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

function sanitizeId(value: string, fallback: string): string {
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  return sanitized || fallback;
}

function normalizeShape(shape: CanvasNodeShape | undefined): CanvasNodeShape {
  if (shape && NODE_SHAPES.includes(shape)) {
    return shape;
  }

  return "rectangle";
}

function normalizeColorPair(colorIndex: number | undefined) {
  if (
    typeof colorIndex === "number" &&
    Number.isInteger(colorIndex) &&
    colorIndex >= 0 &&
    colorIndex < NODE_COLORS.length
  ) {
    return NODE_COLORS[colorIndex];
  }

  return NODE_COLORS[0];
}

function normalizeDimension(
  value: number | undefined,
  fallback: number,
  minimum: number
): number {
  if (!isFiniteNumber(value)) {
    return fallback;
  }

  return Math.max(minimum, Math.min(420, roundToGrid(value)));
}

function createNode(action: DesignAction, index: number): CanvasNode {
  const shape = normalizeShape(action.shape);
  const colorPair = normalizeColorPair(action.colorIndex);
  const defaults = SHAPE_DEFAULTS[shape];
  const x = isFiniteNumber(action.x)
    ? roundToGrid(action.x)
    : (index % 4) * NODE_SPACING;
  const y = isFiniteNumber(action.y)
    ? roundToGrid(action.y)
    : Math.floor(index / 4) * NODE_SPACING;

  return {
    id: sanitizeId(action.id ?? action.label ?? "", `ai-node-${Date.now()}-${index}`),
    type: "canvasNode",
    position: { x, y },
    width: normalizeDimension(action.width, defaults.width, MIN_NODE_WIDTH),
    height: normalizeDimension(action.height, defaults.height, MIN_NODE_HEIGHT),
    data: {
      label: action.label?.trim() || "Untitled component",
      color: colorPair.fill,
      textColor: colorPair.text,
      shape,
    },
  };
}

function createEdge(action: DesignAction, index: number): CanvasEdge | null {
  if (!action.source || !action.target || action.source === action.target) {
    return null;
  }

  const source = sanitizeId(action.source, "");
  const target = sanitizeId(action.target, "");

  if (!source || !target || source === target) {
    return null;
  }

  return {
    id: sanitizeId(action.id ?? `${source}-${target}`, `ai-edge-${Date.now()}-${index}`),
    source,
    target,
    type: "canvasEdge",
    data: {
      label: action.label?.trim() ?? "",
    },
    markerEnd: {
      type: "arrowclosed",
      color: "var(--text-primary)",
      width: 18,
      height: 18,
    },
    style: {
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

function hasStatus(error: unknown, status: number): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: unknown }).status === status
  );
}

function createEmptyFlowStorage() {
  return new LiveObject({
    nodes: new LiveMap<string, LiveblocksNode<CanvasNode>>(),
    edges: new LiveMap<string, LiveblocksEdge<CanvasEdge>>(),
  });
}

async function ensureDesignRoom(roomId: string) {
  const liveblocks = getLiveblocks();

  if (!roomId.trim()) {
    throw new Error("Design agent roomId is required.");
  }

  try {
    await liveblocks.getRoom(roomId);
  } catch (error) {
    if (!hasStatus(error, 404)) {
      throw error;
    }

    throw new Error(
      `Liveblocks room "${roomId}" does not exist. Open the project workspace first or trigger the agent through POST /api/ai/design so the authenticated API can prepare the room.`
    );
  }

  try {
    await liveblocks.getStorageDocument(roomId);
  } catch (error) {
    if (!hasStatus(error, 404)) {
      throw error;
    }

    await liveblocks.initializeStorageDocument(roomId, {
      liveblocksType: "LiveObject",
      data: {
        flow: {
          liveblocksType: "LiveObject",
          data: {
            nodes: {
              liveblocksType: "LiveMap",
              data: {},
            },
            edges: {
              liveblocksType: "LiveMap",
              data: {},
            },
          },
        },
      },
    });
    return;
  }

  await liveblocks.mutateStorage(roomId, ({ root }) => {
    const storageRoot = root as unknown as MutableStorageRoot;

    if (!storageRoot.get("flow")) {
      storageRoot.set("flow", createEmptyFlowStorage());
    }
  });
}

async function publishStatus(
  roomId: string,
  status: Liveblocks["RoomEvent"]["status"],
  message: string
) {
  const liveblocks = getLiveblocks();
  const event: Liveblocks["RoomEvent"] = {
    type: "ai-status",
    status,
    message,
    createdAt: Date.now(),
  };

  await liveblocks.broadcastEvent(roomId, event);

  try {
    await liveblocks.createFeedMessage<Liveblocks["FeedMessageData"]>({
      roomId,
      feedId: AI_STATUS_FEED_ID,
      data: event,
    });
  } catch {
    try {
      await liveblocks.createFeed({
        roomId,
        feedId: AI_STATUS_FEED_ID,
        metadata: { title: "AI status" },
      });
      await liveblocks.createFeedMessage<Liveblocks["FeedMessageData"]>({
        roomId,
        feedId: AI_STATUS_FEED_ID,
        data: event,
      });
    } catch {
      // Status events are still broadcast live; feed persistence is best-effort.
    }
  }
}

async function safeUpdateAiPresence(
  roomId: string,
  presence: Liveblocks["Presence"],
  ttl = 60
) {
  try {
    await getLiveblocks().setPresence(roomId, {
      userId: AI_USER_ID,
      data: presence,
      ttl,
      userInfo: {
        name: "Ghost AI",
        avatar: "",
        color: "#6457f9",
      },
    });
  } catch (error) {
    console.warn(
      `[design-agent] Failed to update AI presence for room ${roomId}: ${getErrorMessage(error)}`
    );
  }
}

function describeCanvasSnapshot(value: unknown): string {
  return JSON.stringify(value, null, 2).slice(0, 12000);
}

export const designAgent = schemaTask({
  id: "design-agent",
  schema: parseDesignAgentPayload,
  run: async (payload: DesignAgentPayload) => {
    const liveblocks = getLiveblocks();

    await ensureDesignRoom(payload.roomId);
    await safeUpdateAiPresence(payload.roomId, {
      cursor: { x: -120, y: -80 },
      thinking: true,
    });
    await publishStatus(payload.roomId, "start", "Ghost AI started designing.");

    try {
      await publishStatus(
        payload.roomId,
        "processing",
        "Reading the current canvas and planning changes."
      );

      const currentCanvas = await liveblocks.getStorageDocument(
        payload.roomId,
        "json"
      );
     const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

          console.log(
        "Gemini key loaded:",
        !!process.env.GOOGLE_GENERATIVE_AI_API_KEY
      );

      const result = await generateText({
        model: google("gemini-2.5-flash"),
        output: Output.object({
          schema: designPlanSchema,
          name: "design_plan",
          description:
            "A concise system design plan expressed as safe canvas actions.",
        }),
        system: [
          "You are Ghost AI, a collaborative system design architect.",
          "Return only actions that update the existing React Flow canvas.",
          "Use the allowed node shapes: rectangle, diamond, circle, pill, cylinder, hexagon.",
          `Use colorIndex values from 0 to ${NODE_COLORS.length - 1}; do not invent colors.`,
          "Prefer left-to-right or top-to-bottom layouts with at least 220px between nodes.",
          "Use cylinders for databases/storage, pills for services/processes, hexagons for external systems/boundaries, diamonds for decisions, circles for events/endpoints, and rectangles for general components.",
          "When adding edges, source and target must reference existing node IDs or node IDs created by earlier actions.",
          "Keep labels short and technical. Do not delete existing user content unless the prompt explicitly asks for removal.",
        ].join("\n"),
        prompt: [
          `User prompt:\n${payload.prompt}`,
          `Current canvas JSON:\n${describeCanvasSnapshot(currentCanvas)}`,
        ].join("\n\n"),
      });

      await publishStatus(
        payload.roomId,
        "processing",
        "Applying generated canvas updates."
      );

      const plan = result.output;
      let appliedActions = 0;

      await liveblocks.mutateStorage(payload.roomId, ({ root }) => {
        const flow = root.get("flow");
        const nodes = flow.get("nodes");
        const edges = flow.get("edges");

        plan.actions.slice(0, MAX_ACTIONS).forEach((action, index) => {
          if (action.type === "add_node") {
            const node = createNode(action, index);
            nodes.set(
              node.id,
              LiveObject.from(
                node as unknown as JsonObject
              ) as LiveblocksNode<CanvasNode>
            );
            appliedActions += 1;
            return;
          }

          if (action.type === "move_node" && action.id) {
            const node = nodes.get(sanitizeId(action.id, ""));

            if (node && isFiniteNumber(action.x) && isFiniteNumber(action.y)) {
              node.set("position", {
                x: roundToGrid(action.x),
                y: roundToGrid(action.y),
              });
              appliedActions += 1;
            }
            return;
          }

          if (action.type === "resize_node" && action.id) {
            const node = nodes.get(sanitizeId(action.id, ""));

            if (node) {
              const nodeData = node.get("data") as MutableCanvasNodeData;
              const shape = normalizeShape(nodeData.get("shape"));
              const defaults = SHAPE_DEFAULTS[shape];

              node.set(
                "width",
                normalizeDimension(action.width, defaults.width, MIN_NODE_WIDTH)
              );
              node.set(
                "height",
                normalizeDimension(action.height, defaults.height, MIN_NODE_HEIGHT)
              );
              appliedActions += 1;
            }
            return;
          }

          if (action.type === "update_node_data" && action.id) {
            const node = nodes.get(sanitizeId(action.id, ""));
            const data = node?.get("data") as MutableCanvasNodeData | undefined;

            if (node && data) {
              if (typeof action.label === "string") {
                data.set("label", action.label.trim());
              }

              if (action.shape) {
                data.set("shape", normalizeShape(action.shape));
              }

              if (typeof action.colorIndex === "number") {
                const colorPair = normalizeColorPair(action.colorIndex);
                data.set("color", colorPair.fill);
                data.set("textColor", colorPair.text);
              }

              appliedActions += 1;
            }
            return;
          }

          if (action.type === "delete_node" && action.id) {
            const nodeId = sanitizeId(action.id, "");

            if (nodeId && nodes.delete(nodeId)) {
              for (const [edgeId, edge] of edges.entries()) {
                if (edge.get("source") === nodeId || edge.get("target") === nodeId) {
                  edges.delete(edgeId);
                }
              }
              appliedActions += 1;
            }
            return;
          }

          if (action.type === "add_edge") {
            const edge = createEdge(action, index);

            if (
              edge &&
              nodes.has(edge.source) &&
              nodes.has(edge.target) &&
              !edges.has(edge.id)
            ) {
              edges.set(
                edge.id,
                LiveObject.from(
                  edge as unknown as JsonObject
                ) as LiveblocksEdge<CanvasEdge>
              );
              appliedActions += 1;
            }
            return;
          }

          if (action.type === "delete_edge" && action.id) {
            if (edges.delete(sanitizeId(action.id, ""))) {
              appliedActions += 1;
            }
          }
        });
      });

      await publishStatus(
        payload.roomId,
        "complete",
        `Design update complete: ${appliedActions} canvas change${
          appliedActions === 1 ? "" : "s"
        } applied.`
      );

      return {
        summary: plan.summary,
        appliedActions,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The design agent failed unexpectedly.";

      await publishStatus(payload.roomId, "error", `Design failed: ${message}`);
      throw error;
    } finally {
      await safeUpdateAiPresence(
        payload.roomId,
        {
          cursor: null,
          thinking: false,
        },
        2
      );
    }
  },
});
