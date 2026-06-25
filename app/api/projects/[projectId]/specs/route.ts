import { getCurrentUserIdentity, userHasProjectAccess } from "@/lib/project-access"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

interface ProjectSpecsRouteContext {
  params: Promise<{
    projectId: string
  }>
}

function getSpecFilename(filePath: string, specId: string) {
  try {
    const pathname = new URL(filePath).pathname
    const filename = pathname.split("/").filter(Boolean).at(-1)

    if (filename) {
      return decodeURIComponent(filename)
    }
  } catch {
    const filename = filePath.split("/").filter(Boolean).at(-1)

    if (filename) {
      return decodeURIComponent(filename)
    }
  }

  return `ghost-ai-spec-${specId}.md`
}

export async function GET(
  _request: Request,
  context: ProjectSpecsRouteContext
) {
  const { projectId } = await context.params
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

  const specs = await prisma.projectSpec.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      filePath: true,
      createdAt: true,
    },
  })

  return Response.json({
    specs: specs.map((spec) => ({
      id: spec.id,
      createdAt: spec.createdAt.toISOString(),
      filename: getSpecFilename(spec.filePath, spec.id),
    })),
  })
}
