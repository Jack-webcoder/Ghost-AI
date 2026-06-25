import { get } from "@vercel/blob";

import { getCurrentUserIdentity, userHasProjectAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

interface ProjectSpecDownloadRouteContext {
  params: Promise<{
    projectId: string;
    specId: string;
  }>;
}

function getSpecFilename(specId: string) {
  return `ghost-ai-spec-${encodeURIComponent(specId)}.md`;
}

export async function GET(
  _request: Request,
  context: ProjectSpecDownloadRouteContext
) {
  const { projectId, specId } = await context.params;
  const identity = await getCurrentUserIdentity();

  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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

  const spec = await prisma.projectSpec.findFirst({
    where: {
      id: specId,
      projectId,
    },
    select: {
      id: true,
      filePath: true,
    },
  });

  if (!spec) {
    return Response.json({ error: "Spec not found" }, { status: 404 });
  }

  try {
    const blob = await get(spec.filePath, {
      access: "private",
      useCache: false,
    });

    if (!blob || blob.statusCode !== 200 || !blob.stream) {
      return Response.json({ error: "Spec not found" }, { status: 404 });
    }

    return new Response(blob.stream, {
      headers: {
        "Content-Disposition": `attachment; filename="${getSpecFilename(spec.id)}"`,
        "Content-Type": "text/markdown; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "Spec not found" }, { status: 404 });
  }
}
