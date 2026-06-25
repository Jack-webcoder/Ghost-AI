import type { LiveblocksFlow } from "@liveblocks/react-flow"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"
import type { AiStatusFeedMessage, ChatFeedMessage } from "@/types/tasks"

declare global {
  interface Liveblocks {
    Presence: {
      cursor: {
        x: number
        y: number
      } | null
      thinking: boolean
    }

    Storage: {
      flow: LiveblocksFlow<CanvasNode, CanvasEdge>
    }

    UserMeta: {
      id: string
      info: {
        name: string
        avatar: string
        color: string
      }
    }

    RoomEvent: {
      type: "ai-status"
      status: "start" | "processing" | "complete" | "error"
      message: string
      createdAt: number
    }
    FeedMessageData: AiStatusFeedMessage | ChatFeedMessage
    ThreadMetadata: Record<string, never>
    RoomInfo: Record<string, never>
  }
}

export {}
