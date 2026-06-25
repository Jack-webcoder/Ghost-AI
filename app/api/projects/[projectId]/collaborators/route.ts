import { auth } from "@clerk/nextjs/server"

import {
  enrichCollaboratorEmails,
  normalizeCollaboratorEmail,
} from "@/lib/project-collaborators"
import { getCurrentUserIdentity } from "@/lib/project-access"
import { prisma } from "@/lib/prisma"

interface CollaboratorsRouteContext {
  params: Promise<{
    projectId: string
  }>
}

interface CollaboratorBody {
  email?: unknown
}

function isRequestBody(value: unknown): value is CollaboratorBody {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function readEmail(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return { error: "Invalid request body" }
  }

  if (!isRequestBody(body) || typeof body.email !== "string") {
    return { error: "A valid email address is required" }
  }

  const email = normalizeCollaboratorEmail(body.email)

  if (!isValidEmail(email)) {
    return { error: "A valid email address is required" }
  }

  return { email }
}

async function getProjectAccess(projectId: string) {
  const identity = await getCurrentUserIdentity()

  if (!identity) {
    return {
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  })

  if (!project) {
    return {
      response: Response.json({ error: "Project not found" }, { status: 404 }),
    }
  }

  const collaborators = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: { email: true },
  })
  const isOwner = project.ownerId === identity.userId
  const isCollaborator =
    identity.email !== "" &&
    collaborators.some(
      ({ email }) => normalizeCollaboratorEmail(email) === identity.email
    )

  if (!isOwner && !isCollaborator) {
    return {
      response: Response.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return {
    response: null,
    isOwner,
    collaborators,
  }
}

export async function GET(
  _request: Request,
  context: CollaboratorsRouteContext
) {
  const { projectId } = await context.params
  const access = await getProjectAccess(projectId)

  if (access.response) {
    return access.response
  }

  const collaborators = await enrichCollaboratorEmails(
    access.collaborators.map(({ email }) => email)
  )

  return Response.json({
    isOwner: access.isOwner,
    collaborators,
  })
}

export async function POST(
  request: Request,
  context: CollaboratorsRouteContext
) {
  const { userId } = await auth()

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await context.params
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  })

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 })
  }

  if (project.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const parsed = await readEmail(request)

  if (!parsed.email) {
    return Response.json({ error: parsed.error }, { status: 400 })
  }

  const existingCollaborator = await prisma.projectCollaborator.findUnique({
    where: {
      projectId_email: {
        projectId,
        email: parsed.email,
      },
    },
    select: { id: true },
  })

  if (existingCollaborator) {
    return Response.json(
      { error: "This collaborator already has access" },
      { status: 409 }
    )
  }

  await prisma.projectCollaborator.create({
    data: {
      projectId,
      email: parsed.email,
    },
  })

  const [collaborator] = await enrichCollaboratorEmails([parsed.email])

  return Response.json({ collaborator }, { status: 201 })
}

export async function DELETE(
  request: Request,
  context: CollaboratorsRouteContext
) {
  const { userId } = await auth()

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await context.params
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  })

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 })
  }

  if (project.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const parsed = await readEmail(request)

  if (!parsed.email) {
    return Response.json({ error: parsed.error }, { status: 400 })
  }

  const result = await prisma.projectCollaborator.deleteMany({
    where: {
      projectId,
      email: parsed.email,
    },
  })

  if (result.count === 0) {
    return Response.json({ error: "Collaborator not found" }, { status: 404 })
  }

  return Response.json({ success: true })
}
