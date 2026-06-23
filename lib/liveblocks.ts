import "server-only"

import { Liveblocks } from "@liveblocks/node"

const USER_COLORS = [
  "#E57373",
  "#F06292",
  "#BA68C8",
  "#9575CD",
  "#7986CB",
  "#64B5F6",
  "#4DD0E1",
  "#4DB6AC",
  "#81C784",
  "#FFB74D",
] as const

let liveblocks: Liveblocks | undefined

export function getLiveblocks(): Liveblocks {
  if (liveblocks) {
    return liveblocks
  }

  const secret = process.env.LIVEBLOCKS_SECRET_KEY

  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY must be defined.")
  }

  liveblocks = new Liveblocks({ secret })

  return liveblocks
}

export function getUserColor(userId: string): string {
  let hash = 0

  for (const character of userId) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  }

  return USER_COLORS[hash % USER_COLORS.length]
}
