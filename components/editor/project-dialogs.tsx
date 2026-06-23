"use client"

import type { FormEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { UseProjectActionsResult } from "@/hooks/use-project-actions"

interface ProjectDialogsProps {
  actions: UseProjectActionsResult
}

export function ProjectDialogs({ actions }: ProjectDialogsProps) {
  const project = actions.activeDialog.project

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void actions.createProject()
  }

  function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void actions.renameProject()
  }

  return (
    <>
      <Dialog
        open={actions.activeDialog.type === "create"}
        onOpenChange={(open) => {
          if (!open) actions.closeDialog()
        }}
      >
        <DialogContent className="rounded-3xl border border-surface-border bg-elevated p-6 sm:max-w-md">
          <form className="grid gap-5" onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="text-copy-primary">
                Create Project
              </DialogTitle>
              <DialogDescription className="text-copy-muted">
                Name your new architecture workspace.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              <label
                htmlFor="create-project-name"
                className="text-sm font-medium text-copy-secondary"
              >
                Project name
              </label>
              <Input
                id="create-project-name"
                className="text-copy-primary caret-brand"
                value={actions.projectName}
                onChange={(event) => actions.setProjectName(event.target.value)}
                placeholder="My architecture project"
                autoFocus
                disabled={actions.isLoading}
              />
              <p className="text-xs text-copy-muted" aria-live="polite">
                Room ID:{" "}
                <span className="font-mono text-copy-secondary">
                  {actions.roomId}
                </span>
              </p>
            </div>

            <DialogFooter className="rounded-b-3xl border-surface-border bg-subtle/50">
              <Button
                type="button"
                variant="outline"
                onClick={actions.closeDialog}
                disabled={actions.isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!actions.projectName.trim() || actions.isLoading}
              >
                {actions.isLoading ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={actions.activeDialog.type === "rename"}
        onOpenChange={(open) => {
          if (!open) actions.closeDialog()
        }}
      >
        <DialogContent className="rounded-3xl border border-surface-border bg-elevated p-6 sm:max-w-md">
          <form className="grid gap-5" onSubmit={handleRename}>
            <DialogHeader>
              <DialogTitle className="text-copy-primary">
                Rename Project
              </DialogTitle>
              <DialogDescription className="text-copy-muted">
                Enter a new name for{" "}
                <span className="text-copy-secondary">
                  {project?.name ?? "this project"}
                </span>
                .
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              <label
                htmlFor="rename-project-name"
                className="text-sm font-medium text-copy-secondary"
              >
                Project name
              </label>
              <Input
                id="rename-project-name"
                className="text-copy-primary caret-brand"
                value={actions.projectName}
                onChange={(event) => actions.setProjectName(event.target.value)}
                autoFocus
                disabled={actions.isLoading}
              />
            </div>

            <DialogFooter className="rounded-b-3xl border-surface-border bg-subtle/50">
              <Button
                type="button"
                variant="outline"
                onClick={actions.closeDialog}
                disabled={actions.isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!actions.projectName.trim() || actions.isLoading}
              >
                {actions.isLoading ? "Renaming..." : "Rename Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={actions.activeDialog.type === "delete"}
        onOpenChange={(open) => {
          if (!open) actions.closeDialog()
        }}
      >
        <DialogContent className="rounded-3xl border border-surface-border bg-elevated p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-copy-primary">
              Delete Project
            </DialogTitle>
            <DialogDescription className="text-copy-muted">
              Are you sure you want to delete{" "}
              <span className="text-copy-secondary">
                {project?.name ?? "this project"}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="rounded-b-3xl border-surface-border bg-subtle/50">
            <Button
              type="button"
              variant="outline"
              onClick={actions.closeDialog}
              disabled={actions.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void actions.deleteProject()}
              disabled={actions.isLoading}
            >
              {actions.isLoading ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
