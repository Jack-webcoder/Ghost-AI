"use client"

import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  useCreateFeed,
  useCreateFeedMessage,
  useFeedMessages,
  useSelf,
} from "@liveblocks/react"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import { Bot, Download, FileText, Loader2, Send, X } from "lucide-react"
import ReactMarkdown from "react-markdown"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  AI_STATUS_FEED_ID,
  CHAT_FEED_ID,
  type ChatFeedMessage,
  getAiStatusText,
  parseAiStatusFeedMessage,
  parseChatFeedMessage,
} from "@/types/tasks"

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  roomId: string
  aiStatus: Liveblocks["RoomEvent"] | null
}

interface ValidatedChatFeedMessage {
  id: string
  createdAt: number
  data: ChatFeedMessage
}

interface ActiveRun {
  runId: string
  publicToken: string
}

interface DesignRunResponse {
  runId?: unknown
  publicToken?: unknown
  error?: unknown
}

interface DesignTokenResponse {
  publicToken?: unknown
  error?: unknown
}

interface ProjectSpecListItem {
  id: string
  createdAt: string
  filename: string
}

interface ProjectSpecsResponse {
  specs?: unknown
  error?: unknown
}

const starterPrompts = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
]

const terminalRunStatuses = new Set([
  "COMPLETED",
  "CANCELED",
  "FAILED",
  "CRASHED",
  "SYSTEM_FAILURE",
  "EXPIRED",
  "TIMED_OUT",
])

function formatTimestamp(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp))
}

function formatSpecCreatedAt(createdAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(createdAt))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseProjectSpecs(value: unknown): ProjectSpecListItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (
        !isRecord(item) ||
        typeof item.id !== "string" ||
        typeof item.createdAt !== "string" ||
        typeof item.filename !== "string"
      ) {
        return null
      }

      return {
        id: item.id,
        createdAt: item.createdAt,
        filename: item.filename,
      }
    })
    .filter((item): item is ProjectSpecListItem => item !== null)
}

function getResponseError(payload: { error?: unknown }, fallback: string) {
  return typeof payload.error === "string" && payload.error.trim().length > 0
    ? payload.error
    : fallback
}

function getRunSummary(output: unknown) {
  if (!isRecord(output)) {
    return null
  }

  return typeof output.summary === "string" && output.summary.trim().length > 0
    ? output.summary
    : null
}

async function requestJson<TPayload>(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  const payload = (await response.json()) as TPayload

  return { response, payload }
}

export function AiSidebar({
  isOpen,
  onClose,
  projectId,
  roomId,
  aiStatus,
}: AiSidebarProps) {
  const [prompt, setPrompt] = useState("")
  const [sendError, setSendError] = useState<string | null>(null)
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null)
  const [isStartingRun, setIsStartingRun] = useState(false)
  const [specs, setSpecs] = useState<ProjectSpecListItem[]>([])
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(false)
  const [specsError, setSpecsError] = useState<string | null>(null)
  const [selectedSpec, setSelectedSpec] = useState<ProjectSpecListItem | null>(
    null
  )
  const [specPreview, setSpecPreview] = useState<string | null>(null)
  const [isLoadingSpecPreview, setIsLoadingSpecPreview] = useState(false)
  const [specPreviewError, setSpecPreviewError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const handledRunIdRef = useRef<string | null>(null)
  const createFeed = useCreateFeed()
  const createFeedMessage = useCreateFeedMessage()
  const self = useSelf()
  const { run, error: realtimeRunError } = useRealtimeRun(activeRun?.runId, {
    accessToken: activeRun?.publicToken,
    enabled: Boolean(activeRun?.runId && activeRun.publicToken),
  })
  const { messages: statusFeedMessages } = useFeedMessages(AI_STATUS_FEED_ID)
  const { messages: chatFeedMessages } = useFeedMessages(CHAT_FEED_ID)
  const currentSender = self?.info.name ?? "You"
  const isRunTerminal = run ? terminalRunStatuses.has(run.status) : false
  const isLoading = isStartingRun || Boolean(activeRun && !isRunTerminal)
  const latestStatusMessage = statusFeedMessages
    ?.slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((message) => parseAiStatusFeedMessage(message.data))
    .find((message) => message !== null)
  const sharedStatusText = latestStatusMessage
    ? getAiStatusText(latestStatusMessage)
    : null
  const statusText = sharedStatusText ?? aiStatus?.message ?? null
  const activeStatusText =
    isLoading && statusText ? statusText : isLoading ? "Ghost AI is working..." : null
  const validatedChatMessages = useMemo<ValidatedChatFeedMessage[]>(() => {
    return (
      chatFeedMessages
        ?.map((message) => {
          const data = parseChatFeedMessage(message.data)

          if (!data) {
            return null
          }

          return {
            id: message.id,
            createdAt: message.createdAt,
            data,
          }
        })
        .filter((message): message is ValidatedChatFeedMessage =>
          Boolean(message)
        )
        .sort(
          (a, b) =>
            (a.data.timestamp || a.createdAt) -
            (b.data.timestamp || b.createdAt)
        ) ?? []
    )
  }, [chatFeedMessages])
  const publishChatMessage = useCallback(
    async (data: ChatFeedMessage) => {
      try {
        await createFeedMessage(CHAT_FEED_ID, data)
        return
      } catch {
        // The feed may not exist yet in a fresh room.
      }

      await createFeed(CHAT_FEED_ID, {
        metadata: {
          type: "chat",
        },
      })
      await createFeedMessage(CHAT_FEED_ID, data)
    },
    [createFeed, createFeedMessage]
  )
  const publishAssistantError = useCallback(
    async (message: string) => {
      await publishChatMessage({
        sender: "Ghost AI",
        role: "assistant",
        content: message,
        timestamp: Date.now(),
      })
    },
    [publishChatMessage]
  )
  const downloadSpec = useCallback(
    (specId: string) => {
      const anchor = document.createElement("a")
      anchor.href = `/api/projects/${encodeURIComponent(
        projectId
      )}/specs/${encodeURIComponent(specId)}/download`
      anchor.download = ""
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
    },
    [projectId]
  )

  useEffect(() => {
    void createFeed(AI_STATUS_FEED_ID, {
      metadata: {
        type: "ai-status",
      },
    }).catch(() => {
      // The shared status feed may already exist.
    })

    void createFeed(CHAT_FEED_ID, {
      metadata: {
        type: "chat",
      },
    }).catch(() => {
      // The room chat feed may already exist.
    })
  }, [createFeed])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: "end" })
  }, [validatedChatMessages.length])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const controller = new AbortController()

    async function loadSpecs() {
      setIsLoadingSpecs(true)
      setSpecsError(null)

      try {
        const response = await fetch(
          `/api/projects/${encodeURIComponent(projectId)}/specs`,
          {
            signal: controller.signal,
          }
        )
        const payload = (await response.json()) as ProjectSpecsResponse

        if (!response.ok) {
          throw new Error(
            getResponseError(payload, "Specs could not be loaded.")
          )
        }

        setSpecs(parseProjectSpecs(payload.specs))
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }

        setSpecsError("Specs could not be loaded.")
      } finally {
        setIsLoadingSpecs(false)
      }
    }

    void loadSpecs()

    return () => {
      controller.abort()
    }
  }, [isOpen, projectId])

  useEffect(() => {
    if (!selectedSpec) {
      return
    }

    const spec = selectedSpec
    const controller = new AbortController()

    async function loadSpecPreview() {
      setIsLoadingSpecPreview(true)
      setSpecPreview(null)
      setSpecPreviewError(null)

      try {
        const response = await fetch(
          `/api/projects/${encodeURIComponent(
            projectId
          )}/specs/${encodeURIComponent(spec.id)}`,
          {
            signal: controller.signal,
          }
        )

        if (!response.ok) {
          throw new Error("Spec preview could not be loaded.")
        }

        setSpecPreview(await response.text())
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }

        setSpecPreviewError("Spec preview could not be loaded.")
      } finally {
        setIsLoadingSpecPreview(false)
      }
    }

    void loadSpecPreview()

    return () => {
      controller.abort()
    }
  }, [projectId, selectedSpec])

  useEffect(() => {
    if (!realtimeRunError || !activeRun) {
      return
    }

    void publishChatMessage({
      sender: "Ghost AI",
      role: "assistant",
      content: `Unable to track the design run: ${realtimeRunError.message}`,
      timestamp: Date.now(),
    }).finally(() => {
      setActiveRun(null)
      setIsStartingRun(false)
    })
  }, [activeRun, publishChatMessage, realtimeRunError])

  useEffect(() => {
    if (!run || !isRunTerminal || handledRunIdRef.current === run.id) {
      return
    }

    handledRunIdRef.current = run.id

    const content =
      run.status === "COMPLETED"
        ? getRunSummary(run.output) ??
          "Design update complete. The canvas has been updated."
        : run.error?.message ??
          `Design run ended with status ${run.status.toLowerCase()}.`

    void publishChatMessage({
      sender: "Ghost AI",
      role: "assistant",
      content,
      timestamp: Date.now(),
    }).finally(() => {
      setActiveRun(null)
      setIsStartingRun(false)
    })
  }, [isRunTerminal, publishChatMessage, run])

  function resizeTextarea(element: HTMLTextAreaElement) {
    element.style.height = "auto"
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`
  }

  function handlePromptChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setPrompt(event.target.value)
    setSendError(null)
    resizeTextarea(event.target)
  }

  function handleStarterPromptClick(starterPrompt: string) {
    setPrompt(starterPrompt)
    setSendError(null)

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        resizeTextarea(textareaRef.current)
        textareaRef.current.focus()
      }
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextPrompt = prompt.trim()

    if (!nextPrompt || isLoading) {
      return
    }

    setIsStartingRun(true)

    try {
      await publishChatMessage({
        sender: currentSender,
        role: "user",
        content: nextPrompt,
        timestamp: Date.now(),
      })

      setPrompt("")
      setSendError(null)

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "72px"
        }
      })

      const { response: designResponse, payload: designPayload } =
        await requestJson<DesignRunResponse>("/api/ai/design", {
          prompt: nextPrompt,
          roomId,
          projectId,
        })

      if (!designResponse.ok || typeof designPayload.runId !== "string") {
        throw new Error(
          getResponseError(designPayload, "Design run could not be started.")
        )
      }

      let publicToken =
        typeof designPayload.publicToken === "string"
          ? designPayload.publicToken
          : null

      if (!publicToken) {
        const { response: tokenResponse, payload: tokenPayload } =
          await requestJson<DesignTokenResponse>("/api/ai/design/token", {
            runId: designPayload.runId,
          })

        if (!tokenResponse.ok || typeof tokenPayload.publicToken !== "string") {
          throw new Error(
            getResponseError(tokenPayload, "Design run token could not be created.")
          )
        }

        publicToken = tokenPayload.publicToken
      }

      handledRunIdRef.current = null
      setActiveRun({
        runId: designPayload.runId,
        publicToken,
      })
    } catch {
      const message = "Design request failed. Try again."

      try {
        await publishAssistantError(message)
      } catch {
        setSendError(message)
      }

      setIsStartingRun(false)
    }
  }

  function handlePromptKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  function handlePreviewOpenChange(open: boolean) {
    if (!open) {
      setSelectedSpec(null)
      setSpecPreview(null)
      setSpecPreviewError(null)
      setIsLoadingSpecPreview(false)
    }
  }

  return (
    <aside
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        "absolute inset-y-3 right-3 z-30 hidden w-80 flex-col overflow-hidden rounded-2xl border border-surface-border bg-base/95 shadow-2xl backdrop-blur transition-[transform,opacity] duration-200 ease-out xl:flex",
        isOpen
          ? "translate-x-0 opacity-100"
          : "pointer-events-none translate-x-[calc(100%+1.5rem)] opacity-0"
      )}
    >
      <header className="flex min-h-20 items-center justify-between border-b border-surface-border px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ai/15 text-ai-text">
            <Bot className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-copy-primary">
              AI Workspace
            </h2>
            <p className="truncate text-xs text-copy-muted">
              Collaborate with Ghost AI
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close AI sidebar"
        >
          <X className="h-5 w-5" />
        </Button>
      </header>

      <Tabs defaultValue="architect" className="min-h-0 flex-1 gap-0">
        <div className="border-b border-surface-border px-4 py-3">
          <TabsList className="grid h-10 w-full grid-cols-2 rounded-xl bg-subtle p-1">
            <TabsTrigger
              value="architect"
              className="rounded-lg text-copy-muted data-active:bg-ai/15 data-active:text-ai-text"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="rounded-lg text-copy-muted data-active:bg-ai/15 data-active:text-ai-text"
            >
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="architect"
          className="min-h-0 flex-1 flex-col data-active:flex"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
            {validatedChatMessages.length === 0 ? (
              <div className="flex min-h-full flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ai/15 text-ai-text">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-copy-primary">
                  Start the room chat
                </h3>
                <p className="mt-2 max-w-60 text-sm leading-6 text-copy-muted">
                  Share prompts, notes, and architecture decisions with everyone
                  in this workspace.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {starterPrompts.map((starterPrompt) => (
                    <button
                      key={starterPrompt}
                      type="button"
                      className="rounded-full bg-subtle px-3 py-1.5 text-xs font-medium text-ai-text transition-colors hover:bg-ai/15"
                      onClick={() => handleStarterPromptClick(starterPrompt)}
                    >
                      {starterPrompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {validatedChatMessages.map((message) => {
                  const isCurrentUser = message.data.sender === currentSender

                  return (
                    <article
                      key={message.id}
                      className={cn(
                        "flex max-w-[88%] flex-col gap-1 rounded-2xl px-4 py-3 text-sm leading-6",
                        isCurrentUser
                          ? "ml-auto border-2 border-brand/50 bg-accent-dim text-copy-primary"
                          : "mr-auto border border-surface-border bg-elevated text-copy-primary"
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center gap-2 text-[11px] leading-none text-copy-muted",
                          isCurrentUser && "justify-end"
                        )}
                      >
                        <span className="max-w-28 truncate">
                          {isCurrentUser ? "You" : message.data.sender}
                        </span>
                        <span>{formatTimestamp(message.data.timestamp)}</span>
                      </div>
                      <p className="whitespace-pre-wrap break-words">
                        {message.data.content}
                      </p>
                    </article>
                  )
                })}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          <form
            className="border-t border-surface-border p-4"
            onSubmit={handleSubmit}
          >
            {activeStatusText ? (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-success/40 bg-elevated px-3 py-2 text-xs text-copy-muted">
                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-success" />
                <span className="min-w-0 truncate">{activeStatusText}</span>
              </div>
            ) : null}
            {sendError ? (
              <div className="mb-3 rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">
                {sendError}
              </div>
            ) : null}
            <Textarea
              ref={textareaRef}
              value={prompt}
              onChange={handlePromptChange}
              onKeyDown={handlePromptKeyDown}
              placeholder="Ask Ghost AI to update the design..."
              className="max-h-[160px] min-h-[72px] resize-none overflow-y-auto border-surface-border bg-elevated text-copy-primary placeholder:text-copy-faint focus-visible:border-ai focus-visible:ring-ai/30"
              rows={3}
              disabled={isLoading}
            />
            <div className="mt-3 flex justify-end">
              <Button
                type="submit"
                className="rounded-xl bg-success px-4 text-base hover:bg-success/80 disabled:bg-subtle disabled:text-copy-faint"
                disabled={isLoading || prompt.trim().length === 0}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isLoading ? "Running" : "Send"}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent
          value="specs"
          className="min-h-0 flex-1 flex-col gap-4 p-4 data-active:flex"
        >
          <Button
            type="button"
            className="h-10 rounded-xl bg-ai text-white hover:bg-ai/80"
          >
            <FileText className="h-4 w-4" />
            Generate Spec
          </Button>

          <ScrollArea className="min-h-0 flex-1 rounded-2xl border border-surface-border bg-elevated">
            <div className="flex flex-col gap-2 p-3">
              {isLoadingSpecs ? (
                <div className="flex items-center gap-2 px-2 py-3 text-sm text-copy-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading specs...
                </div>
              ) : specsError ? (
                <div className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
                  {specsError}
                </div>
              ) : specs.length === 0 ? (
                <div className="px-2 py-8 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-ai/15 text-ai-text">
                    <FileText className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-copy-primary">
                    No specs yet
                  </p>
                  <p className="mt-1 text-xs leading-5 text-copy-muted">
                    Generated Markdown specs will appear here.
                  </p>
                </div>
              ) : (
                specs.map((spec) => (
                  <div
                    key={spec.id}
                    className="flex items-center gap-2 rounded-xl border border-surface-border bg-base p-1 transition-colors hover:bg-subtle"
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-1 text-left focus-visible:ring-2 focus-visible:ring-ai/50 focus-visible:outline-none"
                      onClick={() => setSelectedSpec(spec)}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ai/15 text-ai-text">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-copy-primary">
                          {spec.filename}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-copy-muted">
                          {formatSpecCreatedAt(spec.createdAt)}
                        </p>
                      </div>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-copy-muted hover:text-ai-text"
                      aria-label={`Download ${spec.filename}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        downloadSpec(spec.id)
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Dialog
        open={selectedSpec !== null}
        onOpenChange={handlePreviewOpenChange}
      >
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-hidden rounded-3xl border border-surface-border bg-elevated p-0 text-copy-primary sm:max-w-3xl">
          <DialogHeader className="border-b border-surface-border px-6 py-5">
            <div className="flex items-start gap-3 pr-8">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ai/15 text-ai-text">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate text-base font-semibold text-copy-primary">
                  {selectedSpec?.filename ?? "Spec Preview"}
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-copy-muted">
                  {selectedSpec
                    ? formatSpecCreatedAt(selectedSpec.createdAt)
                    : "Generated Markdown spec"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[65vh]">
            <div className="px-6 py-5">
              {isLoadingSpecPreview ? (
                <div className="flex items-center gap-2 text-sm text-copy-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading preview...
                </div>
              ) : specPreviewError ? (
                <div className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
                  {specPreviewError}
                </div>
              ) : specPreview ? (
                <div className="max-w-none space-y-4 text-sm leading-7 text-copy-secondary [&_a]:text-brand [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-ai/50 [&_blockquote]:pl-4 [&_blockquote]:text-copy-muted [&_code]:rounded [&_code]:bg-base [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-ai-text [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-copy-primary [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-copy-primary [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-copy-primary [&_li]:ml-5 [&_li]:list-disc [&_ol>li]:list-decimal [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-surface-border [&_pre]:bg-base [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:text-copy-primary">
                  <ReactMarkdown>{specPreview}</ReactMarkdown>
                </div>
              ) : null}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 border-t border-surface-border bg-subtle/50 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-surface-border bg-base text-copy-primary"
              onClick={() => handlePreviewOpenChange(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-ai text-white hover:bg-ai/80"
              disabled={!selectedSpec}
              onClick={() => {
                if (selectedSpec) {
                  downloadSpec(selectedSpec.id)
                }
              }}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
