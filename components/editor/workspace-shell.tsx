"use client"

import { useState } from "react"
import {
  Bot,
  LayoutTemplate,
  Menu,
  PanelLeftClose,
  Share2,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CanvasRoom } from "@/components/editor/canvas/canvas-room"
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
  const [pendingTemplate, setPendingTemplate] =
    useState<CanvasTemplate | null>(null)
  const actions = useProjectActions(project.id)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-base text-copy-primary">
      <nav className="flex h-16 shrink-0 items-center justify-between border-b border-surface-border bg-base px-4">
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

        <div className="flex items-center gap-2">
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
            roomId={project.id}
            pendingTemplate={pendingTemplate}
            onTemplateImported={() => setPendingTemplate(null)}
          />
        </main>

        <aside
          aria-hidden={!isAiSidebarOpen}
          inert={!isAiSidebarOpen}
          className={`absolute inset-y-3 right-3 z-30 hidden w-80 flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface/95 shadow-2xl backdrop-blur transition-[transform,opacity] duration-200 ease-out xl:flex ${
            isAiSidebarOpen
              ? "translate-x-0 opacity-100"
              : "pointer-events-none translate-x-[calc(100%+1.5rem)] opacity-0"
          }`}
        >
          <div className="flex min-h-20 items-center justify-between border-b border-surface-border px-6">
            <div>
              <h2 className="font-semibold text-copy-primary">AI Copilot</h2>
              <p className="text-sm text-copy-faint">Placeholder panel</p>
            </div>
            <Sparkles className="h-5 w-5 text-ai-text" />
          </div>

          <div className="flex min-h-0 flex-1 flex-col justify-between gap-6 p-6">
            <div className="rounded-3xl border border-surface-border-subtle bg-elevated p-6">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-ai/15 text-ai-text">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-copy-primary">
                    Chat surface pending
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-copy-muted">
                    The toggle is wired. Messaging and generation are
                    intentionally out of scope here.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-dashed border-surface-border-subtle bg-base/40 p-6">
              <p className="text-xs font-semibold tracking-[0.25em] text-copy-faint">
                FUTURE HOOKS
              </p>
              <p className="mt-4 text-sm leading-7 text-copy-muted">
                Prompt composer, run status, and architecture guidance will
                attach to this sidebar.
              </p>
            </div>
          </div>
        </aside>
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
