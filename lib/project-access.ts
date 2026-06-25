import "server-only"

import { auth, clerkClient } from "@clerk/nextjs/server"
import type { Prisma } from "@/lib/generated/prisma/client"
import { prisma } from "@/lib/prisma"

export interface CurrentUserIdentity {
  userId: string
  email: string
}

export async function getCurrentUserIdentity(): Promise<CurrentUserIdentity | null> {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId
  )?.emailAddress

  return {
    userId,
    email: primaryEmail?.toLowerCase() ?? "",
  }
}

export async function userHasProjectAccess(
  identity: CurrentUserIdentity,
  projectId: string
): Promise<boolean> {
  const accessConditions: Prisma.ProjectWhereInput[] = [
    { ownerId: identity.userId },
  ]

  if (identity.email) {
    accessConditions.push({
      collaborators: {
        some: {
          email: identity.email,
        },
      },
    })
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: accessConditions,
    },
    select: {
      id: true,
    },
  })

  return project !== null
}
