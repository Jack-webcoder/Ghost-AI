"use client"

import { useCallback, useState } from "react"
import { LiveMap, LiveObject } from "@liveblocks/client"
import {
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense"
import type {
  LiveblocksEdge,
  LiveblocksNode,
} from "@liveblocks/react-flow"
import {
  LayoutTemplate,
  Menu,
  PanelLeftClose,
  Share2,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AiSidebar } from "@/components/editor/ai-sidebar"
import { CanvasRoom } from "@/components/editor/canvas/canvas-room"
import type { CanvasSaveControls } from "@/components/editor/canvas/canvas-editor"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectShareDialog } from "@/components/editor/project-share-dialog"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import {
  StarterTemplatesModal,
} from "@/components/editor/starter-templates-modal"
import type { CanvasTemplate } from "@/components/editor/starter-templates"
import type { ProjectModel } from "@/lib/generated/prisma/models"
import type { ProjectRow } from "@/hooks/use-project-actions"
import { useProjectActions } from "@/hooks/use-project-actions"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

interface WorkspaceShellProps {
  project: ProjectModel
  ownedProjects: ProjectRow[]
  sharedProjects: ProjectRow[]
}

export function WorkspaceShell({
  project,
  ownedProjects,
  sharedProjects,
}: WorkspaceShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(true)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false)
  const [canvasSaveControls, setCanvasSaveControls] =
    useState<CanvasSaveControls | null>(null)
  const [pendingTemplate, setPendingTemplate] =
    useState<CanvasTemplate | null>(null)
  const [aiStatus, setAiStatus] = useState<Liveblocks["RoomEvent"] | null>(null)
  const actions = useProjectActions(project.id)
  const handleSaveControlsChange = useCallback(
    (controls: CanvasSaveControls) => {
      setCanvasSaveControls(controls)
    },
    []
  )

  const saveButtonLabel =
    canvasSaveControls?.status === "saving"
      ? "Saving..."
      : canvasSaveControls?.status === "saved"
        ? "Saved"
        : canvasSaveControls?.status === "error"
          ? "Error"
          : "Save"

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-base text-copy-primary">
      <nav className="grid h-16 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 border-b border-surface-border bg-base px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label={
              isSidebarOpen
                ? "Close projects sidebar"
                : "Open projects sidebar"
            }
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-copy-primary">
              {project.name}
            </h1>
            <p className="text-xs text-copy-faint">Workspace</p>
          </div>
        </div>

        <Link
          href="/editor"
          aria-label="Return to Ghost AI home"
          className="text-base font-semibold text-copy-primary transition hover:text-copy-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-base"
        >
          Ghost AI
        </Link>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={canvasSaveControls?.saveNow}
            disabled={!canvasSaveControls || canvasSaveControls.status === "saving"}
            aria-label="Save canvas"
            aria-live="polite"
            className="min-w-24 rounded-xl border-surface-border bg-base px-4"
          >
            {saveButtonLabel}
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsTemplatesOpen(true)}
            title="Import starter template"
            aria-label="Import starter template"
            className="rounded-xl border-surface-border bg-base px-4"
          >
            <LayoutTemplate className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsShareDialogOpen(true)}
            title="Share project"
            aria-label="Share project"
            className="rounded-xl border-surface-border bg-base px-4"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button
            variant="default"
            onClick={() => setIsAiSidebarOpen(!isAiSidebarOpen)}
            title="Toggle AI sidebar"
            aria-pressed={isAiSidebarOpen}
            className="rounded-xl px-4"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI</span>
          </Button>
        </div>
      </nav>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
          <RoomProvider
            id={project.id}
            initialPresence={{ cursor: null, thinking: false }}
            initialStorage={{
              flow: new LiveObject({
                nodes: new LiveMap<string, LiveblocksNode<CanvasNode>>(),
                edges: new LiveMap<string, LiveblocksEdge<CanvasEdge>>(),
              }),
            }}
          >
            <ProjectSidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              ownedProjects={ownedProjects}
              sharedProjects={sharedProjects}
              onCreate={actions.openCreateDialog}
              onRename={actions.openRenameDialog}
              onDelete={actions.openDeleteDialog}
              currentProjectId={project.id}
              variant="workspace"
            />

            <main className="absolute inset-0 overflow-hidden bg-base">
              <CanvasRoom
                projectId={project.id}
                pendingTemplate={pendingTemplate}
                onTemplateImported={() => setPendingTemplate(null)}
                onSaveControlsChange={handleSaveControlsChange}
                onAiStatus={setAiStatus}
              />
            </main>

            <AiSidebar
              isOpen={isAiSidebarOpen}
              onClose={() => setIsAiSidebarOpen(false)}
              projectId={project.id}
              roomId={project.id}
              aiStatus={aiStatus}
            />
          </RoomProvider>
        </LiveblocksProvider>
      </div>
      <ProjectShareDialog
        projectId={project.id}
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
      />
      <StarterTemplatesModal
        open={isTemplatesOpen}
        onOpenChange={setIsTemplatesOpen}
        onImport={setPendingTemplate}
      />
      <ProjectDialogs actions={actions} />
    </div>
  )
}
