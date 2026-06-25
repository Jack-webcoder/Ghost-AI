import { auth } from "@clerk/nextjs/server";
import { auth as triggerAuth } from "@trigger.dev/sdk";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const tokenRequestSchema = z.object({
  runId: z.string().trim().min(1),
});

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

  const parsed = tokenRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Run ID is required" }, { status: 400 });
  }

  const taskRun = await prisma.taskRun.findFirst({
    where: {
      runId: parsed.data.runId,
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
    expirationTime: "1h",
  });

  return Response.json({ publicToken });
}
