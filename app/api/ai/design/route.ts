import { tasks } from "@trigger.dev/sdk";

import { getLiveblocks } from "@/lib/liveblocks";
import { getCurrentUserIdentity, userHasProjectAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import type { designAgent } from "@/trigger/design-agent";

export const runtime = "nodejs";

interface DesignRequestBody {
  prompt?: unknown;
  roomId?: unknown;
  projectId?: unknown;
}

function isRequestBody(value: unknown): value is DesignRequestBody {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

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

  if (!isRequestBody(body)) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (
    !isNonEmptyString(body.prompt) ||
    !isNonEmptyString(body.roomId) ||
    !isNonEmptyString(body.projectId)
  ) {
    return Response.json(
      { error: "Prompt, roomId, and projectId are required" },
      { status: 400 }
    );
  }

  const prompt = body.prompt.trim();
  const roomId = body.roomId.trim();
  const projectId = body.projectId.trim();

  if (roomId !== projectId) {
    return Response.json(
      { error: "Room must match the project" },
      { status: 400 }
    );
  }

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

  try {
    await getLiveblocks().getOrCreateRoom(roomId, {
      defaultAccesses: [],
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to prepare the Liveblocks room";

    return Response.json(
      { error: "Unable to prepare Liveblocks room", detail: message },
      { status: 502 }
    );
  }

  const handle = await tasks.trigger<typeof designAgent>("design-agent", {
    prompt,
    roomId,
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
