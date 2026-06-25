import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

interface ProjectRouteContext {
  params: Promise<{
    projectId: string;
  }>;
}

interface RenameProjectBody {
  name?: unknown;
}

function isRequestBody(value: unknown): value is RenameProjectBody {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function getOwnedProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) {
    return {
      response: Response.json({ error: "Project not found" }, { status: 404 }),
    };
  }

  if (project.ownerId !== userId) {
    return {
      response: Response.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { response: null };
}

export async function PATCH(request: Request, context: ProjectRouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await context.params;
  const ownership = await getOwnedProject(projectId, userId);

  if (ownership.response) {
    return ownership.response;
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

  if (typeof body.name !== "string") {
    return Response.json({ error: "Project name must be a string" }, { status: 400 });
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { name: body.name },
  });

  return Response.json(project);
}

export async function DELETE(_request: Request, context: ProjectRouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await context.params;
  const ownership = await getOwnedProject(projectId, userId);

  if (ownership.response) {
    return ownership.response;
  }

  await prisma.project.delete({
    where: { id: projectId },
  });

  return Response.json({ success: true });
}
