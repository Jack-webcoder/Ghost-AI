"use client"

import Link from "next/link"
import { Pencil, Plus, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import type { ProjectRow } from "@/hooks/use-project-actions"
import { cn } from "@/lib/utils"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  ownedProjects: ProjectRow[]
  sharedProjects: ProjectRow[]
  onCreate: () => void
  onRename: (project: ProjectRow) => void
  onDelete: (project: ProjectRow) => void
  currentProjectId?: string
  variant?: "floating" | "workspace"
}

interface ProjectListProps {
  projects: ProjectRow[]
  emptyMessage: string
  showActions?: boolean
  onRename?: (project: ProjectRow) => void
  onDelete?: (project: ProjectRow) => void
  currentProjectId?: string
  workspaceStyle?: boolean
}

function ProjectList({
  projects,
  emptyMessage,
  showActions = false,
  onRename,
  onDelete,
  currentProjectId,
  workspaceStyle = false,
}: ProjectListProps) {
  if (projects.length > 0) {
    return (
      <ul className="grid content-start gap-1">
        {projects.map((project) => (
          <li
            key={project.id}
            className={cn(
              "group flex min-w-0 items-center gap-2 rounded-xl px-3 py-2 transition-colors",
              currentProjectId === project.id
                ? workspaceStyle
                  ? "border border-brand/20 bg-accent-dim text-brand"
                  : "bg-accent-dim text-brand"
                : "hover:bg-subtle"
            )}
          >
            {workspaceStyle && (
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  currentProjectId === project.id
                    ? "bg-brand"
                    : "bg-copy-faint"
                )}
              />
            )}
            <Link
              href={`/editor/${project.id}`}
              className="min-w-0 flex-1 truncate text-sm text-copy-secondary hover:text-copy-primary"
            >
              {project.name}
            </Link>
            {showActions && (
              <div className="flex shrink-0 items-center opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onRename?.(project)}
                  aria-label={`Rename ${project.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDelete?.(project)}
                  aria-label={`Delete ${project.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-surface-border p-6 text-center">
      <p className="text-sm text-copy-muted">{emptyMessage}</p>
    </div>
  )
}

export function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects,
  sharedProjects,
  onCreate,
  onRename,
  onDelete,
  currentProjectId,
  variant = "floating",
}: ProjectSidebarProps) {
  const isWorkspace = variant === "workspace"
  const defaultTab = sharedProjects.some(
    (project) => project.id === currentProjectId
  )
    ? "shared"
    : "my-projects"

  return (
    <>
      <button
        type="button"
        aria-label="Close projects sidebar"
        className={cn(
          "fixed inset-0 z-30 bg-base/70 backdrop-blur-xs transition-opacity md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        id="project-sidebar"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={cn(
          "inset-y-3 left-3 z-40 flex w-[min(20rem,calc(100vw-1.5rem))] flex-col rounded-2xl border border-surface-border bg-surface/95 shadow-2xl backdrop-blur transition-[transform,opacity] duration-200 ease-out",
          isWorkspace ? "absolute md:w-80" : "fixed",
          isOpen
            ? "translate-x-0 opacity-100"
            : "pointer-events-none -translate-x-[calc(100%+1.5rem)] opacity-0"
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between border-b border-surface-border px-4 py-3",
            isWorkspace && "min-h-16 px-5"
          )}
        >
          <h2 className="text-base font-semibold text-copy-primary">
            Projects
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close projects sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Tabs
          key={currentProjectId}
          defaultValue={defaultTab}
          className={cn("min-h-0 flex-1 p-4", isWorkspace && "gap-4")}
        >
          <TabsList
            className={cn(
              "grid w-full grid-cols-2",
              isWorkspace && "h-10 rounded-2xl bg-subtle p-1"
            )}
          >
            <TabsTrigger value="my-projects">My Projects</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
          </TabsList>

          <TabsContent
            value="my-projects"
            className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-2"
          >
            <ProjectList
              projects={ownedProjects}
              emptyMessage="Your projects will appear here."
              showActions
              onRename={onRename}
              onDelete={onDelete}
              currentProjectId={currentProjectId}
              workspaceStyle={isWorkspace}
            />
          </TabsContent>
          <TabsContent
            value="shared"
            className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-2"
          >
            <ProjectList
              projects={sharedProjects}
              emptyMessage="Projects shared with you will appear here."
              currentProjectId={currentProjectId}
              workspaceStyle={isWorkspace}
            />
          </TabsContent>
        </Tabs>

        <div
          className={cn(
            "border-t border-surface-border p-4",
            isWorkspace && "p-3"
          )}
        >
          <Button
            type="button"
            className={cn(
              "w-full",
              isWorkspace && "h-10 rounded-xl text-sm font-semibold"
            )}
            onClick={onCreate}
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}
