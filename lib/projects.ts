import { auth, clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import type { ProjectModel } from "@/lib/generated/prisma/models/Project"

export async function getProjectsForUser(): Promise<{
  ownedProjects: ProjectModel[]
  sharedProjects: ProjectModel[]
}> {
  const { userId } = await auth()

  if (!userId) {
    return { ownedProjects: [], sharedProjects: [] }
  }

  const ownedProjects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  })

  const client = await clerkClient()
  const user = await client.users.getUser(userId)

  const userEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase()

  let sharedProjects: ProjectModel[] = []
  if (userEmail) {
    const collaboratorProjects = await prisma.projectCollaborator.findMany({
      where: { email: userEmail },
    })

    const projectIds = collaboratorProjects.map((c) => c.projectId)

    if (projectIds.length > 0) {
      sharedProjects = await prisma.project.findMany({
        where: { id: { in: projectIds } },
        orderBy: { createdAt: "desc" },
      })
    }
  }

  return { ownedProjects, sharedProjects }
}
