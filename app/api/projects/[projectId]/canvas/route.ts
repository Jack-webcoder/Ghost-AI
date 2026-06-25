import { get, put } from "@vercel/blob"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import { getCurrentUserIdentity, userHasProjectAccess } from "@/lib/project-access"
import { prisma } from "@/lib/prisma"
import type { CanvasSnapshot } from "@/types/canvas"

export const runtime = "nodejs"

const LOCAL_CANVAS_URL_PREFIX = "local-canvas://"

interface ProjectCanvasRouteContext {
  params: Promise<{
    projectId: string
  }>
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isCanvasSnapshot(value: unknown): value is CanvasSnapshot {
  return (
    isObject(value) &&
    Array.isArray(value.nodes) &&
    Array.isArray(value.edges)
  )
}

function getLocalCanvasFilePath(projectId: string) {
  return path.join(
    process.cwd(),
    ".local",
    "canvas",
    `${encodeURIComponent(projectId)}.json`
  )
}

function getLocalCanvasUrl(projectId: string) {
  return `${LOCAL_CANVAS_URL_PREFIX}${encodeURIComponent(projectId)}`
}

function getProjectIdFromLocalCanvasUrl(url: string) {
  if (!url.startsWith(LOCAL_CANVAS_URL_PREFIX)) {
    return null
  }

  return decodeURIComponent(url.slice(LOCAL_CANVAS_URL_PREFIX.length))
}

async function readLocalCanvasSnapshot(projectId: string) {
  try {
    const snapshot = JSON.parse(
      await readFile(getLocalCanvasFilePath(projectId), "utf8")
    ) as unknown

    if (!isCanvasSnapshot(snapshot)) {
      return {
        response: Response.json(
          { error: "Saved canvas is invalid" },
          { status: 502 }
        ),
      }
    }

    return { response: Response.json(snapshot) }
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const code = (error as { code?: unknown }).code

      if (code === "ENOENT") {
        return {
          response: Response.json(
            { nodes: [], edges: [] } satisfies CanvasSnapshot
          ),
        }
      }
    }

    return {
      response: Response.json(
        { error: "Saved canvas could not be loaded" },
        { status: 502 }
      ),
    }
  }
}

async function writeCanvasSnapshot(projectId: string, snapshot: CanvasSnapshot) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(
      `canvas/${projectId}.json`,
      JSON.stringify(snapshot),
      {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      }
    )

    return blob.url
  }

  const filePath = getLocalCanvasFilePath(projectId)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(snapshot), "utf8")

  return getLocalCanvasUrl(projectId)
}

async function readBlobCanvasSnapshot(url: string) {
  try {
    const blob = await get(url, {
      access: "private",
      useCache: false,
    })

    if (!blob?.stream) {
      return {
        response: Response.json(
          { error: "Saved canvas could not be loaded" },
          { status: 502 }
        ),
      }
    }

    const snapshot = JSON.parse(await new Response(blob.stream).text()) as unknown

    if (!isCanvasSnapshot(snapshot)) {
      return {
        response: Response.json(
          { error: "Saved canvas is invalid" },
          { status: 502 }
        ),
      }
    }

    return { response: Response.json(snapshot) }
  } catch {
    return {
      response: Response.json(
        { error: "Saved canvas could not be loaded" },
        { status: 502 }
      ),
    }
  }
}

async function getAuthorizedProject(projectId: string) {
  const identity = await getCurrentUserIdentity()

  if (!identity) {
    return {
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const hasAccess = await userHasProjectAccess(identity, projectId)

  if (!hasAccess) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    })

    return {
      response: Response.json(
        { error: project ? "Forbidden" : "Project not found" },
        { status: project ? 403 : 404 }
      ),
    }
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      canvasJsonPath: true,
    },
  })

  if (!project) {
    return {
      response: Response.json({ error: "Project not found" }, { status: 404 }),
    }
  }

  return { response: null, project }
}

export async function GET(
  _request: Request,
  context: ProjectCanvasRouteContext
) {
  const { projectId } = await context.params
  const access = await getAuthorizedProject(projectId)

  if (access.response) {
    return access.response
  }

  if (!access.project.canvasJsonPath) {
    return Response.json({ nodes: [], edges: [] } satisfies CanvasSnapshot)
  }

  const localProjectId = getProjectIdFromLocalCanvasUrl(
    access.project.canvasJsonPath
  )

  if (localProjectId) {
    const localCanvas = await readLocalCanvasSnapshot(localProjectId)
    return localCanvas.response
  }

  const blobCanvas = await readBlobCanvasSnapshot(access.project.canvasJsonPath)
  return blobCanvas.response
}

export async function PUT(
  request: Request,
  context: ProjectCanvasRouteContext
) {
  const { projectId } = await context.params
  const access = await getAuthorizedProject(projectId)

  if (access.response) {
    return access.response
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!isCanvasSnapshot(body)) {
    return Response.json(
      { error: "Canvas state must include nodes and edges arrays" },
      { status: 400 }
    )
  }

  let canvasJsonPath: string

  try {
    canvasJsonPath = await writeCanvasSnapshot(projectId, body)
  } catch {
    return Response.json(
      { error: "Canvas could not be saved" },
      { status: 502 }
    )
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      canvasJsonPath,
    },
  })

  return Response.json({ saved: true, canvasJsonPath })
}
