import { tasks } from "@trigger.dev/sdk";
import { z } from "zod";

import { getCurrentUserIdentity, userHasProjectAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import type { generateSpec } from "@/trigger/generate-spec";
import { ChatFeedMessageSchema } from "@/types/tasks";

export const runtime = "nodejs";

const positionSchema = z
  .object({
    x: z.number(),
    y: z.number(),
  })
  .passthrough();

const canvasNodeSchema = z
  .object({
    id: z.string().min(1),
    position: positionSchema,
    data: z.record(z.string(), z.unknown()).optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  })
  .passthrough();

const canvasEdgeSchema = z
  .object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
    data: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

const specRequestSchema = z.object({
  roomId: z.string().trim().min(1),
  chatHistory: z.array(ChatFeedMessageSchema),
  nodes: z.array(canvasNodeSchema),
  edges: z.array(canvasEdgeSchema),
});

export async function POST(request: Request) {
  const identity = await getCurrentUserIdentity();

  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = specRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { roomId, chatHistory, nodes, edges } = parsed.data;
  const projectId = roomId;
  const hasAccess = await userHasProjectAccess(identity, projectId);

  if (!hasAccess) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    return Response.json(
      { error: project ? "Forbidden" : "Project not found" },
      { status: project ? 403 : 404 }
    );
  }

  const handle = await tasks.trigger<typeof generateSpec>("generate-spec", {
    projectId,
    roomId,
    chatHistory,
    nodes,
    edges,
  });

  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId,
      userId: identity.userId,
    },
  });

  return Response.json({ runId: handle.id });
}
