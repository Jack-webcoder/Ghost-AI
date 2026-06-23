import "server-only"

import { clerkClient } from "@clerk/nextjs/server"

export interface EnrichedCollaborator {
  email: string
  displayName: string | null
  imageUrl: string | null
}

export function normalizeCollaboratorEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function enrichCollaboratorEmails(
  emails: string[]
): Promise<EnrichedCollaborator[]> {
  if (emails.length === 0) {
    return []
  }

  const client = await clerkClient()
  const response = await client.users.getUserList({
    emailAddress: emails,
    limit: Math.min(emails.length, 500),
  })
  const usersByEmail = new Map(
    response.data.flatMap((user) =>
      user.emailAddresses.map((address) => [
        normalizeCollaboratorEmail(address.emailAddress),
        user,
      ] as const)
    )
  )

  return emails.map((email) => {
    const normalizedEmail = normalizeCollaboratorEmail(email)
    const user = usersByEmail.get(normalizedEmail)

    return {
      email: normalizedEmail,
      displayName: user?.fullName ?? user?.username ?? null,
      imageUrl: user?.imageUrl ?? null,
    }
  })
}
