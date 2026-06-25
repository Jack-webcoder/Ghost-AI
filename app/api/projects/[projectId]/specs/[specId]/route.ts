import { get } from "@vercel/blob"

import { getCurrentUserIdentity, userHasProjectAccess } from "@/lib/project-access"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

interface ProjectSpecPreviewRouteContext {
  params: Promise<{
    projectId: string
    specId: string
  }>
}

export async function GET(
  _request: Request,
  context: ProjectSpecPreviewRouteContext
) {
  const { projectId, specId } = await context.params
  const identity = await getCurrentUserIdentity()

  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const hasAccess = await userHasProjectAccess(identity, projectId)

  if (!hasAccess) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    })

    return Response.json(
      { error: project ? "Forbidden" : "Project not found" },
      { status: project ? 403 : 404 }
    )
  }

  const spec = await prisma.projectSpec.findFirst({
    where: {
      id: specId,
      projectId,
    },
    select: {
      filePath: true,
    },
  })

  if (!spec) {
    return Response.json({ error: "Spec not found" }, { status: 404 })
  }

  try {
    const blob = await get(spec.filePath, {
      access: "private",
      useCache: false,
    })

    if (!blob?.stream) {
      return Response.json({ error: "Spec not found" }, { status: 404 })
    }

    return new Response(blob.stream, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return Response.json({ error: "Spec not found" }, { status: 404 })
  }
}
