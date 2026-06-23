import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

interface CreateProjectBody {
  name?: unknown;
  id?: unknown;
}

function isRequestBody(value: unknown): value is CreateProjectBody {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(projects);
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

  if (!isRequestBody(body)) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (body.name !== undefined && typeof body.name !== "string") {
    return Response.json({ error: "Project name must be a string" }, { status: 400 });
  }

  if (body.id !== undefined && typeof body.id !== "string") {
    return Response.json({ error: "Project id must be a string" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      id: body.id,
      ownerId: userId,
      name: body.name ?? "Untitled Project",
    },
  });

  return Response.json(project, { status: 201 });
}
