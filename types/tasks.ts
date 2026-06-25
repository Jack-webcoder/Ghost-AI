import { z } from "zod"

export const AI_STATUS_FEED_ID = "ai-status-feed"
export const CHAT_FEED_ID = "ai-chat"

export const ChatFeedMessageSchema = z.object({
  sender: z.string().min(1),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
  timestamp: z.number(),
})

export type ChatFeedMessage = z.infer<typeof ChatFeedMessageSchema>

export type AiStatusKind = "start" | "processing" | "complete" | "error"

export interface AiStatusFeedMessage
  extends Record<string, string | number | undefined> {
  type: "ai-status"
  status?: AiStatusKind
  text?: string
  message?: string
  createdAt?: number
}

export function parseAiStatusFeedMessage(
  value: unknown
): AiStatusFeedMessage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  const payload = value as Record<string, unknown>

  if (payload.type !== "ai-status") {
    return null
  }

  if (
    payload.status !== undefined &&
    payload.status !== "start" &&
    payload.status !== "processing" &&
    payload.status !== "complete" &&
    payload.status !== "error"
  ) {
    return null
  }

  if (payload.text !== undefined && typeof payload.text !== "string") {
    return null
  }

  if (payload.message !== undefined && typeof payload.message !== "string") {
    return null
  }

  if (payload.createdAt !== undefined && typeof payload.createdAt !== "number") {
    return null
  }

  return {
    type: "ai-status",
    status: payload.status,
    text: payload.text,
    message: payload.message,
    createdAt: payload.createdAt,
  }
}

export function getAiStatusText(message: AiStatusFeedMessage): string | null {
  const text = message.text ?? message.message

  if (!text || text.trim().length === 0) {
    return null
  }

  return text
}

export function parseChatFeedMessage(value: unknown): ChatFeedMessage | null {
  const parsed = ChatFeedMessageSchema.safeParse(value)

  if (!parsed.success) {
    return null
  }

  return parsed.data
}
