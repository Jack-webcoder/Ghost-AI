import { auth, clerkClient } from "@clerk/nextjs/server"
import { getLiveblocks, getUserColor } from "@/lib/liveblocks"
import { userHasProjectAccess } from "@/lib/project-access"

interface LiveblocksAuthBody {
  room?: unknown
}

export async function POST(request: Request) {
  const { userId } = await auth()

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: LiveblocksAuthBody

  try {
    body = (await request.json()) as LiveblocksAuthBody
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof body.room !== "string" ||
    body.room.trim().length === 0
  ) {
    return Response.json({ error: "Room ID is required" }, { status: 400 })
  }

  const roomId = body.room.trim()
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId
  )?.emailAddress
  const hasAccess = await userHasProjectAccess(
    {
      userId,
      email: primaryEmail?.toLowerCase() ?? "",
    },
    roomId
  )

  if (!hasAccess) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const liveblocks = getLiveblocks()

  await liveblocks.getOrCreateRoom(roomId, {
    defaultAccesses: [],
  })

  const session = liveblocks.prepareSession(userId, {
    userInfo: {
      name:
        user.fullName ??
        user.username ??
        primaryEmail ??
        "Anonymous collaborator",
      avatar: user.imageUrl,
      color: getUserColor(userId),
    },
  })

  session.allow(roomId, ["*:write"])

  const { body: responseBody, status } = await session.authorize()

  return new Response(responseBody, { status })
}
