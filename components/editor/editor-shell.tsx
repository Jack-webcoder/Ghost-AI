"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { Button } from "@/components/ui/button"
import type { ProjectRow } from "@/hooks/use-project-actions"
import { useProjectActions } from "@/hooks/use-project-actions"

interface EditorShellProps {
  ownedProjects: ProjectRow[]
  sharedProjects: ProjectRow[]
}

export function EditorShell({
  ownedProjects,
  sharedProjects,
}: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const actions = useProjectActions()

  return (
    <div className="flex min-h-screen flex-col bg-base text-copy-primary">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((isOpen) => !isOpen)}
      />

      <main className="relative flex-1 overflow-hidden" aria-label="Editor home">
        <div className="absolute inset-0 bg-base" />
        <div className="relative z-10 flex h-full min-h-[calc(100vh-3.5rem)] items-center justify-center px-6 py-12 text-center">
          <div className="flex max-w-xl flex-col items-center">
            <h1 className="text-2xl font-semibold text-copy-primary sm:text-3xl">
              Create a project or open an existing one
            </h1>
            <p className="mt-3 text-sm leading-6 text-copy-muted sm:text-base">
              Start a new architecture workspace, or choose a project from the
              sidebar.
            </p>
            <Button
              type="button"
              className="mt-6"
              onClick={actions.openCreateDialog}
            >
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>
      </main>

      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onCreate={actions.openCreateDialog}
        onRename={actions.openRenameDialog}
        onDelete={actions.openDeleteDialog}
      />
      <ProjectDialogs actions={actions} />
    </div>
  )
}
