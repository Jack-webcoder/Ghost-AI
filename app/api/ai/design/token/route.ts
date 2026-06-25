import { auth } from "@clerk/nextjs/server";
import { auth as triggerAuth } from "@trigger.dev/sdk";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

interface TokenRequestBody {
  runId?: unknown;
}

function isRequestBody(value: unknown): value is TokenRequestBody {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!isRequestBody(body) || !isNonEmptyString(body.runId)) {
    return Response.json({ error: "Run ID is required" }, { status: 400 });
  }

  const runId = body.runId.trim();
  const taskRun = await prisma.taskRun.findFirst({
    where: {
      runId,
      userId,
    },
    select: {
      runId: true,
    },
  });

  if (!taskRun) {
    return Response.json({ error: "Run not found" }, { status: 404 });
  }

  const publicToken = await triggerAuth.createPublicToken({
    scopes: {
      read: {
        runs: taskRun.runId,
      },
    },
  });

  return Response.json({ publicToken });
}
